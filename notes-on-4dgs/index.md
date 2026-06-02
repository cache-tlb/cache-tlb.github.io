# 4DGS笔记


### 前言

3DGS的在静态场景重建的效果如此惊艳，人们自然而然就会想要它能动起来。naive的想法是为每一帧训练一个 3DGS，可想而知数据量巨大，不会有人真的这么做。

主流研究工作分为两条路线，一是按照视频编码的思路，先在初始帧或一些关键帧训练 3DGS，后续的帧只需要关心它与关键帧的 diff，例如用 MLP 或其他方式压缩存储每个 GS 点的运动轨迹，并且记录当前帧要新生成或消失的 GS 点，姑且称之为 dynamic 3DGS。

另一种思路是每个GS的属性除了有颜色位置形状，还额外存自己的生命周期和运动路线，没有显式的关键帧的概念，至少在渲染时每一帧的地位都是一样的，这里每个 GS 既有空间属性又有时间属性，或许可以称得上是原教旨主义的 4DGS。

本文讨论属于后者的三篇论文。

### 4DGS

第一篇是复旦大学发表在 ICLR 2024 的工作，4D Gaussian Splatting: Modeling Dynamic Scenes with Native 4D Primitives \[[项目链接](https://fudan-zvg.github.io/4d-gaussian-splatting/)，[论文](https://arxiv.org/abs/2412.20720)，[代码](https://github.com/fudan-zvg/4d-gaussian-splatting)\]。下文的 4DGS 指的是这篇论文。主要思路如下。

3DGS 的 primitive 是一系列空间中的椭球形状的 3D 高斯点，形状相关的参数为 $(\mu_{x,y,z},\Sigma_{x,y,z})$ 。 $\Sigma$ 是3x3的对称矩阵，它进一步由 scale $(s_x,s_y,s_z)$ 和 rotation 四元数 $(r_x,r_y,r_z,r_w)$ 决定。给定相机参数，这个椭球投影到屏幕上变成椭圆，椭圆的不同位置上的高斯函数值决定了 alpha 的大小。

4DGS 对此进行了推广，它的 primitive 是一系列 4D 时空的高斯点，相关参数为 $(\mu_{x,y,z,t},\Sigma_{x,y,z,t})$，这里的 $\Sigma$ 是 4x4 的对称阵，也由 scale 和 rotation 矩阵相乘得到 $\Sigma=RSS^TR^T$。 $S$ 是对角元为 $(s_x,s_y,s_z,s_t)$ 的对角阵， $R=L(q_l)R(q_r)$ 是由两个四元数 $q_l=(a,b,c,d), q_r=(p,q,r,s)$ 构造的正交阵的乘积。给定时间点 $t$ ，4DGS 在 $t$ 的截面上也是一个 3DGS，其参数就是 4D 高斯的条件分布： 
$$
\begin{align*} 
\mu_{x,y,z|t} &= \mu_{1:3} + \Sigma_{1:3,4}\Sigma^{-1}_{4,4}(t-\mu_t) \\\ 
\Sigma_{x,y,z|t} &= \Sigma_{1:3,1:3} - \Sigma_{1:3,4}\Sigma^{-1}_{4,4}\Sigma_{4,1:3} 
\end{align*}
$$
关于多维正态分布的条件分布的推导，可以参考如下链接：
[Wikipedia](https://en.wikipedia.org/wiki/Multivariate_normal_distribution#Conditional_distributions)；
[The Book of Statistical Proofs](https://statproofbook.github.io/P/mvn-cond.html)。
证明就是直接根据定义， $p(x|y)=\dfrac{p(x,y)}{p(y)}$， 这里的联合分布和边缘分布都是高斯函数，相除之后得到的也是高斯函数。

上述公式表明，4DGS 在 xyz 上投影得到的 3DGS，其中心位置是随时间线性变化的，亦即做匀速运动。而这个投影的 3DGS 的形状 $\Sigma_{x,y,z|t}$ 是固定的，不随时间变化，并且也是对称的，因而可以分解成 scale 和 rotation 的组合。

### FreeTimeGS

第二篇是浙江大学 3D 视觉组发表在 CVPR 2025 的工作，FreeTimeGS: Free Gaussian Primitives at Anytime Anywhere for Dynamic Scene Reconstruction \[ [项目链接](https://zju3dv.github.io/freetimegs/)，[论文](https://arxiv.org/abs/2506.05348)，[交互演示](https://www.4dv.ai/)，代码暂未开源 \]。

相比于 3DGS，这里每个 primitive 多存了如下的参数： $\mu_t,\sigma_t,v$，分别表示时间维度的 mean 和 sigma，以及速度。模型假设每个 primitive 是匀速直线运动，速度为 $v$ ； alpha 随着时间先增大再减小，淡入淡出，准确来说是以 $\mu_t$ 时刻为中心，方差为 $\sigma_t$ 的高斯函数。

不难看出，模型的表达能力跟 4DGS 是完全一致的。

### SpaceTimeGS

第三篇是 oppo 发表在 CVPR 2024 上的工作，Spacetime Gaussian Feature Splatting for Real-Time Dynamic View Synthesis \[ [项目链接](https://oppo-us-research.github.io/SpacetimeGaussians-website/)，[论文](https://arxiv.org/abs/2312.16812)，[代码](https://github.com/oppo-us-research/SpacetimeGaussians) \]。

SpaceTimeGS 思路与 FreeTimeGS 在模型上几乎一样，区别在于前者的 primitive 位置是关于时间 $\Delta t$ 的三次函数，为此它的 GS 属性多存了$\Delta t^2$和$\Delta t^3$系数，所以可以表示某一类曲线运动，而在 FreeTimeGS 中，位置是 $\Delta t$ 的线性函数，所以只能表示匀速直线运动。

### 总结

从模型表达能力上来看，SpaceTimeGS > FreeTimeGS = 4DGS。同 3DGS 的原始实现一样，4DGS 的官方实现也是从左右四元数（$q_l$和$q_r$）出发推导 4D 旋转矩阵，进而推导协方差矩阵各个元素关于 $q_l, q_r$ 每个分量的梯度公式，过程非常复杂，因为涉及到normalize 函数的梯度传播，且要在 cuda 里手动实现，很容易写错。4DGS 的协方差矩阵是 4 阶对称阵，自由度为 10。而左右四元数与 xyzt 的 scale，一共也是 10 个自由度。理论上，前向和反向过程都可以以 4D 协方差矩阵的上三角元素为起点，而不必从具有明确物理含义的 rotation 和 scale 出发。

