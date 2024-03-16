# Linearly Transformed Cosines 积分部分推导


用 LTC 计算多边形面光源对标准材质光照时需要计算一个积分式:
$$
\int_{P_o}{D_o(\omega_o)}\ \mathrm{d}\omega_o = \mathrm{E}(P_o) .
$$
这里 $P_o$ 表示原多边形面光源经过线性变换后的形状在单位球面上投影的区域, 因为积分变量$\omega_o$是单位向量, 所以需要将多边形的积分域投影到单位球面上. 被积函数为 $D_o(\omega_o = (x, y, z)) = \dfrac{1}{\pi}\max(0, z)$. 只要将球面上的积分域与$z^+$半球求交集, 作为新的积分域, 就可以将 $D_o$ 中的 $\max$ 函数去掉了. 这个积分有解析表达式, 原论文中没有给出推导, 而是直接给出结论:
$$
\mathrm{E}(p_1,\cdots,p_n) = \frac{1}{2\pi}\sum_{i=1}^{n}{\arccos( \langle p_i,p_j \rangle) \langle  \frac{p_i\times p_j}{||p_i\times p_j||}, [0,0,1]^T\rangle}
$$
其中 $p_1, \cdots, p_n$ 为多边形的各顶点在单位球面上投影的坐标, $j=(i+1)\ \mathrm{mod}\ n$, $\langle p_i, p_j \rangle$ 表示 $p_i$ 与 $p_j$ 的内积,  $p_i \times p_j$ 表示 $p_i$ 与 $p_j$ 的外积.

如何推导呢?

用球面坐标$(\theta,\phi)$表示球面上的点. 
$$
\begin{aligned} 
x &= \cos\theta\sin\phi \\\ 
y &= \sin\theta\sin\phi \\\ 
z &= \cos\phi
\end{aligned} 
$$
分别求微分得到:
$$
\begin{aligned} 
\mathrm{d}x &= -\sin\theta\sin\phi\ \mathrm{d}\theta + \cos\theta\cos\phi\ \mathrm{d}\phi \\\ 
\mathrm{d}y &= \cos\theta\sin\phi\ \mathrm{d}\theta + \sin\theta\cos\phi\ \mathrm{d}\phi\\\ 
\mathrm{d}z &= -\sin\phi\ \mathrm{d}\phi
\end{aligned} 
$$
将 $\mathrm{d}x$ 和 $\mathrm{d}y$ 的表达式分别乘以 $-\sin\theta$ 和 $\cos\theta$ 并相加, 得:
$$
\cos\theta\ \mathrm{d}y - \sin\theta\ \mathrm{d}x = \sin\phi\ \mathrm{d}\theta \qquad\cdots\qquad (1)
$$

回到原积分问题, 要求的是 
$$
\begin{aligned}
\mathrm{E}(P_o) &= \int_{P_o}{D_o(\omega_o)}\ \mathrm{d}\omega_o = \iint_{P_o}{\frac{1}{\pi}\cdot z\ \sin\phi\ \mathrm{d}\phi\mathrm{d}\theta}\\\ 
2\pi\cdot\mathrm{E}(P_o) &= \iint_{P_o}2\ \cos\phi\ \sin\phi\ \mathrm{d}\phi\mathrm{d}\theta = \iint_{P_o}\sin{2\phi}\ \mathrm{d}\phi\mathrm{d}\theta
\end{aligned}
$$
令 
$$
P = \frac{1}{2}(1-\cos{2\phi}) = \sin^2\phi, \qquad Q = 0
$$
则
$$
\frac{\partial P}{\partial\phi} - \frac{\partial Q}{\partial\theta} = \sin{2\phi}
$$
根据格林公式有
$$
\begin{aligned}
I = 2\pi\cdot\mathrm{E}(P_o) &= \iint_{P_o}\sin{2\phi}\ \mathrm{d}\phi\mathrm{d}\theta = \iint_{P_o}\left(\frac{\partial P}{\partial\phi} - \frac{\partial Q}{\partial\theta}\right)\ \mathrm{d}\phi\mathrm{d}\theta \\\ 
&= \oint_{\partial P_o} \left(P\ \mathrm{d}\theta + Q\ \mathrm{d}\phi \right) = \oint_{\partial P_o} {\sin^2\phi}\ \mathrm{d}\theta
\end{aligned}
$$
这里 $\partial P_o$ 表示球面上多边形投影区域$P_o$的边界. 由 (1) 式可进一步得到:
$$
I = \oint_{\partial P_o}\sin\phi(\cos\theta\ \mathrm{d}y - \sin\theta\ \mathrm{d}x) = \oint_{\partial P_o}x\ \mathrm{d}y - y\ \mathrm{d}x = \sum_{i=1}^{n}\int_{\overset{\frown}{p_ip_j}} x\ \mathrm{d}y - y\ \mathrm{d}x
$$
沿着闭曲线的积分被拆成了逐段曲线积分, 每一段积分的路径 $\overset{\frown}{p_ip_j}$ 表示 $p_i$ 和 $p_j$ 所在的大圆上从$p_i$ 到 $p_j$ 的一段圆弧, 其中 $j = (i+1)\ \mathrm{mod}\ n$.

为了计算这一系列的曲线积分, 考虑每一段的参数方程, 由球面插值函数 slerp 可以得到第 $i$ 段曲线的参数方程为:
$$
f_i(t) = a_i(t) p_i + b_i(t) p_j = \frac{\sin (1-t)\alpha_i}{\sin\alpha_i} p_i + \frac{\sin t\alpha_i}{\sin\alpha_i} p_j
$$
其中 $\alpha_i = \arccos(\langle p_i,p_j \rangle)$ 为 $p_i$ 与 $p_j$ 之间的夹角, 或$p_i$ 到 $p_j$ 的大圆弧的圆心角. 在曲线 $\overset{\frown}{p_ip_j}$ 上, 有
$$
\begin{aligned}
x\ \mathrm{d}y - y\ \mathrm{d}x &= (a_ix_i+b_ix_j)(a'_iy_i+b'_iy_j)\mathrm{d}t - (a_iy_i+b_iy_j)(a'_ix_i+b'_ix_j)\mathrm{d}t\\\ 
&= (a_ib'_i - a'_ib_i)(x_iy_j - y_ix_j)\mathrm{d}t
\end{aligned}
$$
这里$(x_i,y_i,z_i)=p_i, (x_j,y_j,z_j)=p_j$ 为常数, $a_i, a'_i, b_i, b'_i$ 为 $t$ 的函数, 而
$$
\begin{aligned}
a'_i(t) &= \frac{1}{\sin\alpha_i}\cos(1-t)\alpha_i\cdot(-\alpha_i)\\\ 
b'_i(t) &= \frac{1}{\sin\alpha_i}\cos t\alpha_i \cdot \alpha_i
\end{aligned}
$$
于是
$$
\begin{aligned}
a_ib'_i - a'_ib_i &= \frac{\alpha_i}{\sin^2\alpha_i}\left(\sin(1-t)\alpha_i\cdot\cos t\alpha_i + \cos(1-t)\alpha_i\cdot\sin t\alpha_i\right)\\\ 
&= \frac{\alpha_i}{\sin^2\alpha_i}\sin((1-t)\alpha_i + t\alpha_i)\\\ 
&= \frac{\alpha_i}{\sin\alpha_i}
\end{aligned}
$$

参数 $t$ 被消去了. 这样每段曲线积分的结果就是
$$
\begin{aligned}
I_i &= \int_{\overset{\frown}{p_ip_j}} x\ \mathrm{d}y - y\ \mathrm{d}x \\\ 
&= \int_0^1(a_ib'_i - a'_ib_i)(x_iy_j - y_ix_j)\ \mathrm{d}t \\\ 
&= \int_0^1 \frac{\alpha_i}{\sin\alpha_i}(x_iy_j - y_ix_j)\ \mathrm{d}t\\\ 
 &= \frac{\alpha_i}{\sin\alpha_i}(x_iy_j - y_ix_j)
\end{aligned}
$$
注意到 $||p_i\times p_j|| = \sin\alpha_i$, 而 $x_iy_j - y_ix_j$ 正好是 $p_i\times p_j$ 的 $z$ 分量, 于是
$$
I_i = \frac{\arccos(\langle p_i,p_j \rangle)}{||p_i\times p_j||}\langle p_i\times p_j,[0,0,1]^T \rangle
$$
所求积分为 
$$
\mathrm{E}(P_o) = \frac{1}{2\pi}I = \frac{1}{2\pi}\sum_{i=1}^n \frac{\arccos(\langle p_i,p_j \rangle)}{||p_i\times p_j||}\langle p_i\times p_j,[0,0,1]^T \rangle
$$

