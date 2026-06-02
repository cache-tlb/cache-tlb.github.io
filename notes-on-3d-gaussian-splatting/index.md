# 3D Gaussian Splatting笔记


3D Gaussian Splatting（简称3DGS，中文通常翻译成3D高斯泼溅）在2023年横空出世，打破了新视角合成（novel view synthesis）问题研究的僵局，生成效果得到质的飞跃。
另一方面，3DGS的模型简单，且天然兼容图形渲染pipeline，在实时渲染领域也产生了不小的影响，也许未来有一天能跟三角网格有相同的地位，甚至取而代之。

论文链接：[\[arxiv\]](https://arxiv.org/pdf/2308.04079) | [\[官网\]](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/3d_gaussian_splatting_low.pdf) | [\[本地存档\]](./3d_gaussian_splatting_low.pdf)

代码链接：[\[Github\]](https://github.com/graphdeco-inria/gaussian-splatting)



## 算法思路

3DGS 的理论源于point spatting（早期文献通常翻译成抛雪球算法），该算法主要用于点云数据的渲染 —— 通过将点云里的每个点投影到相机平面上，并在投影位置附近叠加圆形颜色，一层一侧叠上去，就像将雪球抛在墙上一样。每个雪球的大小由固定参数控制。
3DGS则更进一步，将雪球的形状设计成可以训练的参数，亦即高斯体（Gaussians splatting，GS）。每一个GS都由以下参数定义：
- 中心位置 mean : $\mu = (x,y,z)$, 为高斯体中心点坐标
- 协方差矩阵 cov : $\Sigma$, 决定高斯体的形状和大小
- 不透明度 opacity : $\alpha$, 决定高斯体的基准透明度（中心点的透明度）
- 颜色 color : SH, 决定高斯体从各个方向上看过去的颜色，用来表示高光效果

如何用它来表示扫描的场景呢？论文的思路如下：

1. 从 SFM 稀疏点云初始化 GS 点
2. 根据相机参数（pose和投影矩阵）+ 所有GS点属性，可以渲染出图像，并可以推算出每个GS点对每个像素的贡献。
3. 渲染的图像与真实图像对比，可以得到 loss
4. 由链式法则传导梯度，更新GS点的属性
5. 根据梯度情况调整 GS 点密度，会分裂出新的点

## 训练

训练代码梳理：[\[XMind\]](./GS_Code.xmind) | [\[PDF\]](GS.pdf)

类 `_RasterizeGaussians` 是一个 `torch.autograd.Function` 的子类，定义了前向和反向函数

- 前向的输入是如下的tensor：means3D（xyz），means2D（各gs在屏幕空间的位置，前向过程忽略），sh，color，opacities，scales（3个方向），rotation（四元数），cov3Ds（gs的协方差矩阵）。此外前向还需要相机参数、fov等数据作为不可训练的参数输入。
- 前向的输出为 color（rgb颜色图），radii（每个gs在屏幕空间的投影半径），invdepth（深度图）。radii不参与loss计算，而是用来进行 density control 的策略。
- 反向的输入为 color loss，invdepth loss，raii loss忽略
- 反向的输出为 means3D，means2D，sh，color，opacities，scale，rotation，cov3Ds 的梯度。

### 前向过程
#### 分配空间
1. geometry state，每个 gs 点一个，存gs点的中间变量
2. image state，每个像素一个，存中间变量，包括 alpha 累计值、该像素上最远的 gs id，每个tile在 binning state 的数据范围

#### 预处理
1. 根据scale和rotation计算 3D cov矩阵（球变成椭球）
2. 根据view projection矩阵计算2D cov矩阵 conic，椭球变椭圆，并得到椭圆半径radii
3. 根据相机到gs点的方向计算SH，得到gs点的颜色
4. 根据view projection矩阵和gs位置，得到gs的深度depth、中心投影坐标xy
5. 计算每个 gs 覆盖了哪些 tile （tile id的xy范围）， tile touched个数

#### 计算binning state

用一个大数组存每个tile上所有的gs的id，并且按gs 的深度排好序。步骤如下：

1. 根据所有的 geometry state，调用 `cub::DeviceScan::InclusiveSum` 计算前缀和，这样就知道每个tile在大数组的起点index
2. 同时也知道binning state大数组要分配多少个元素
3. 分配了大数组 point_list，point_list_unsorted，point_list_keys，point_list_keys_unsorted
4. 填充 binning state的 point_list_unsorted 和 point_list_keys_unsorted，一个线程处理一段，对应一个gs的覆盖区域，key是 tile id + depth，value是 gs index，此时大数组每个连续的一段属于同一个gs
5. 将上述 point_list_unsorted / point_list_keys_unsorted数据排序，存在 point_list / point_list_keys 里，此时point list 里连续的一段为 同一个 tile，depth 按距离排，并可以索引到对应的 gs index
6. 扫描 point_list_keys 数组，如果某个位置前后的 tile id不一样，就是交界处，就这个 tile id 在 point_list_keys 的起止位置，见 `identifyTileRanges` 函数。
7. 最终这个起止位置记在了  `imgState.ranges` 里，虽然分配的空间大小等于像素个数，但实际用到的只有 tile 个数

#### 渲染

见 `FORWARD::render` 函数，每个线程处理一个像素，一个线程组处理一个tile（16x16）

1. 获取基本信息：像素坐标、tile坐标，tile在point list的range，这个tile（这一批线程组）要遍历多少个 gs
2. 逐个处理gs，按公式计算alpha，并按 alpha blend的方式累加到图像颜色上，还计算了平均的inv depth。遍历的顺序是从前往后，当后面gs的透射率小于阈值了就可以提前结束。
3. 记录中间变量给 反向使用： $T=\prod_i(1-\alpha_i)$，无论是否提前截至都记录最远叠加上去的 gs index

#### trick

实现上一个tile遍历gs拆成了两层循环，内层循环固定256次，与线程组数量一致，外层循环每次减小256，直到遍历完这个tile的所有 gs。

外层循环开始时，每个线程各自先取一个 gs 数据放在 shared memory 里，这样一次fetch的时间就拿到了256个gs数据。再 sync 。

然后开始内存循环。

~

前向过程的中间变量会存在 pytorch的 ctx里，在反向过程中使用，存的内容包括

tensor：colors_precomp, means3D, scales, rotations, cov3Ds_precomp, radii, sh, opacities, geomBuffer, binningBuffer, imgBuffer

非tensor：num_rendered所有gs覆盖的tile个数（有重复），raster_settings

### 反向过程
入口为 `CudaRasterizer::Rasterizer::backward`

先从ctx里恢复前向过程的中间结果。特别是 imageState，geometryState，binningState

输入数据包括： $\frac{\mathbf{d}L}{\mathbf{d}R_{p}}$， $\frac{\mathbf{d}L}{\mathbf{d}{\rm Z}_p}$，R表示渲染图像，下标p表示不同像素，c表示rgb通道。Z表示inv depth

#### `BACKWARD::render`

根据 $\frac{\mathbf{d}L}{\mathbf{d}R_{p}}$ 等计算 $\frac{\mathbf{d}L}{\mathbf{d}\mu'_k}$， $\frac{\mathbf{d}L}{\mathbf{d}\Sigma'^{-1}_k}$，$\frac{\mathbf{d}L}{\mathbf{d}{\rm o}_k}$，$\frac{\mathbf{d}L}{\mathbf{d}f_k}$，分别表示第k个gs的 2D位置，2D协方差矩阵，opacity，颜色。

反向过程 tile 内 gs 按照从后往前的顺序遍历，因为记录了影响每个像素最远的 tile id，所以可以跳过更远的gs。假设当前是第 k 个gs。

##### alpha的梯度

像素的最终颜色按如下递归的形式叠加 $R=A_n=\alpha_nf_n+(1-\alpha_n)A_{n-1}$，且 $A_0$ 是常数，那么 

$$
\begin{aligned}
\frac{\mathbf{d}}{\mathbf{d}\alpha_k}A_n &=\frac{\mathbf{d}}{\mathbf{d}\alpha_k}(\alpha_nf_n)+A_{n-1}\frac{\mathbf{d}}{\mathbf{d}\alpha_k}(1-\alpha_n)+(1-\alpha_n)\frac{\mathbf{d}}{\mathbf{d}\alpha_k}A_{n-1} \\\ 
&=(f_n-A_{n-1})\frac{\mathbf{d}\alpha_n}{\mathbf{d}\alpha_k}+(1-\alpha_n)\frac{\mathbf{d}}{\mathbf{d}\alpha_k}A_{n-1} 
\end{aligned}
$$

这里n是最近的，1是最远的。

注意到 $\frac{\mathbf{d}\alpha_i}{\mathbf{d}\alpha_k}$仅当 i==k时取值为1，否则取值为0。

以及 $\frac{\mathbf{d}}{\mathbf{d}\alpha_k}A_i$ 当 i<k 的时候都等于0.

例如， 

$$
\begin{aligned}
\frac{\mathbf{d}}{\mathbf{d}\alpha_1}A_n &=(1-\alpha_n)(1-\alpha_{n-1})\cdots(1-\alpha_2)(f_1-A_0)\\\ 
\frac{\mathbf{d}}{\mathbf{d}\alpha_2}A_n &=(1-\alpha_n)(1-\alpha_{n-1})\cdots(1-\alpha_3)(f_2-A_1)
\end{aligned}
$$

在从 1 到 n遍历的过程中， $A_i$ 的值可以逐渐累加，

因为已经在前向保存了中间结果 $T=\prod(1-\alpha_i)$，每个像素存一个。在遍历时，只要从 T 开始，每次除以一个 $1-\alpha$ 即可。

##### opacity的梯度

渲染时一个gs的像素 $\alpha$ 值是在opacity 的基础上乘以高斯函数：

$$
\alpha_k=o_k\cdot e^{-\frac{1}{2}(X-\mu'_k)^T\Sigma_k'^{-1}(X-\mu'_k)}
$$

于是根据链式法则，$\displaystyle \frac{\mathbf{d}L}{\mathbf{d}o_k}=\frac{\mathbf{d}L}{\mathbf{d}R}\frac{\mathbf{d}R}{\mathbf{d}\alpha_k}\frac{\mathbf{d}\alpha_k}{\mathbf{d}o_k}$

##### means2D 的梯度
gs点的位置只影响他的alpha，所以梯度只通过alpha的梯度传导过来。记

$$
\Sigma_k'^{-1}=\begin{bmatrix}c_x & c_y \\ c_y & c_z\end{bmatrix},\ \ X-\mu_k'=[d_x, d_y]
$$

$$
-\frac{1}{2}(X-\mu_k')^T \Sigma'^{-1}_k(X-\mu_k')=-\frac{1}{2}(c_xd_x^2+2c_yd_xd_y+c_zd_y^2)
$$

则

$$
\frac{\mathbf{d}\alpha_k}{\mathbf{d}\mu_{k,x}'}=-\alpha_k\cdot(c_xd_x+c_yd_y),\ \ \frac{\mathbf{d}\alpha_k}{\mathbf{d}\mu_{k,y}'}=-\alpha_k\cdot(c_yd_x+c_zd_y)
$$

##### cov2D的梯度

$$
\frac{\mathbf{d}\alpha_k}{\mathbf{d}c_x}=-\frac{1}{2}\alpha_kd_x^2,\ \ \  \frac{\mathbf{d}\alpha_k}{\mathbf{d}c_y}=-\frac{1}{2}\alpha_kd_xd_y,\ \ \ \frac{\mathbf{d}\alpha_k}{\mathbf{d}c_z}=-\frac{1}{2}\alpha_kd_y^2
$$

##### color的梯度

$$
\begin{aligned}
\frac{\mathbf{d}}{\mathbf{d}f_k}A_n &=\frac{\mathbf{d}}{\mathbf{d}f_k}(\alpha_nf_n)+(1-\alpha_n)\frac{\mathbf{d}}{\mathbf{d}f_k}A_{n-1} \\\ 
&=\alpha_n\frac{\mathbf{d}f_n}{\mathbf{d}f_k}+(1-\alpha_n)\frac{\mathbf{d}}{\mathbf{d}f_k}A_{n-1} \\\ 
&=\cdots\\\ 
&=(1-\alpha_n)(1-\alpha_{n-1})\cdots(1-\alpha_{k+1})\alpha_k
\end{aligned}
$$

#### `BACKWARD::preprocess`
这一步将 forward 过程的preprocess进行反向，先将 cov2D、means2D 的梯度传播到 cov3D，means3D，将color梯度传到 SH，将cov3D 梯度传到scale 和 rotation。

主要涉及到 3D 高斯协方差矩阵相对于2D协方差矩阵的求导 $\dfrac{\mathbf{d}\Sigma}{\mathbf{d}\Sigma'}$，3D协方差矩阵相对于旋转的四元数的求导 $\dfrac{\mathbf{d}\Sigma}{\mathbf{d}q}$，公式推导见论文，这里略过

#### 备注
cov3D 是 3x3 的实对称矩阵，总共有 6 个自由度。scale （vec3）和 ration（quaternion）的自由度也是6，所以表达能力上是等价的。

理论上，在训练过程中，可以只关注 cov3D，没必要计算 scale 和 rotation 的梯度传播。

导入导出也是一样。如需要scale、rotation，可以根据cov3D反推出来。

### 密度控制
gs的初始化是由 SFM 点云得到，有些地方缺少点云，或者有点 gs 点的scale比较大，对这两种情况分别进行 clone 和 split。

## 渲染

### 数据存储

采用ply格式，按逐顶点属性依次排列。包括 xyz，rgb，scale，rotation，sh，opacity。有些实现会把 rgb 和 sh 拆开，有些会合在一起。

这些属性塞在几个buffer或者texture里，传给GPU。

### 排序

每一帧拿到view矩阵，算出每个gs中心点的z，按z值排序。排序结果写入一个单独的buffer或texture中，称为orderBuffer。例如 orderBuffer第1个放最远的gs，第2个放倒数第二远的，等等。

实际上，排序可以用radix排序，即不一定是严格顺序，例如在supersplat中，将gs点按相机空间的z分在不同的桶里，桶内的顺序可以是乱的。

### draw

调用 `drawInstanced`，topology 是 triangle list。因为gs的数据统一存在SSBO/texture中，所以无需绑定vertex buffer和index buffer。

vertex shader里根据vertex id知道它属于第几个三角形，进而知道它是第几个四边形。每两个三角形组成一个四边形。根据四边形index拿到对应的gs数据，由gs的scale和rotation就可以算出顶点对应的位置。

## 点评

由一些简单的半透明图元逼近表示复杂的图像，这一类工作由来已久，例如：[用50个多边形重现蒙娜丽莎](https://www.rogeralsing.com/2008/12/07/genetic-programming-evolution-of-mona-lisa/)，[用100个三角形绘制Firefox图标](https://fwjmath.wordpress.com/2009/03/02/genetic-algorithm-evolution-in-memory/)，[Geometrize: Turn Images into Geometric Primitives](https://news.ycombinator.com/item?id=25485493)。

它的共同之处都是使用遗传算法/模拟退火等策略，迭代地寻找能使目标函数最大的突变/搜索方向。
随着近年自动微分技术的发展，状态搜索的过程不再盲目。


