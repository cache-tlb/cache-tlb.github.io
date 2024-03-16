# 球面插值函数 slerp 推导


单位球, 球心在原点 $O$, 球面上有两点 $P_0, P_1$, 求插值函数 $P_t$, 其中$t\in[0,1]$, 满足 $P_t$ 与 $P_0, P_1$ 位于同一个大圆上, $P_{t=0} = P_0, P_{t=1}=P_1$, 且 $P_t$ 随 $t$ 均匀地从 $P_0$ 转动到 $P_1$. 

设 $\vec{v_0} = \vec{OP_0}$ 与 $\vec{v_1} = \vec{OP_1}$ 夹角为 $\alpha$, 则 $\cos\alpha = \vec{v_0}\cdot\vec{v_1}$. 而 $P_t$ 与 $O,P_0, P_1$ 共面, 则 $P_t$ 的坐标可以表示为 $P_0, P_1$ 的线性组合, 设 $P_t = a_t P_0 + b_tP_1$, 则 $\vec{OP_t} = a_t \vec{v_0} + b_t \vec{v_1}$ 与 $\vec{v_0}$ 的夹角为 $t\alpha$, 与 $\vec{v_1}$ 的夹角为 $(1-t)\alpha$. 而 $P_0, P_1$位于单位球面上, 所以 $\vec{v_0}\cdot\vec{v_0}=\vec{v_1}\cdot\vec{v_1} = 1$, 于是
$$
\begin{aligned}
\vec{v_0}\cdot(a_t \vec{v_0} + b_t \vec{v_1}) &= a_t + b_t\cos\alpha = \cos t\alpha ,\\\ 
\vec{v_1}\cdot(a_t \vec{v_0} + b_t \vec{v_1}) &= a_t\cos\alpha + b_t = \cos (1-t)\alpha .
\end{aligned}
$$

这是一个二元一次方程, 下式乘以 $\cos\alpha$ 与上式相减得
$$
\begin{aligned}
a_t(1-\cos^2\alpha) &= \cos(t\alpha) - \cos(\alpha-t\alpha) \cos\alpha \\\ 
a_t\sin^2\alpha &= \cos(t\alpha) - \cos\alpha(\cos\alpha\cos(t\alpha)+\sin\alpha\sin(t\alpha))\\\ 
 &= \cos(t\alpha)(1-\cos^2\alpha) - \cos\alpha\sin\alpha\sin(t\alpha)\\\ 
&= \cos(t\alpha)\sin^2\alpha - \cos\alpha\sin\alpha\sin(t\alpha)\\\ 
a_t\sin\alpha &= \cos(t\alpha)\sin\alpha - \cos\alpha\sin(t\alpha)\\\ 
&= \sin(\alpha-t\alpha)
\end{aligned}
$$

于是得到 $a_t = \dfrac{\sin(1-t)\alpha}{\sin\alpha}$, 类似可以求出 $b_t = \dfrac{\sin t\alpha}{\sin\alpha}$. 

上面只是限制了 $P_t$ 与 $O, P_0, P_1$ 共面, 以及两个内积关系, 没有约束$P_t$ 到原点的距离, 事实上, 距离为
$$
\begin{aligned}
|OP_t|^2 &= (a_t \vec{v_0} + b_t \vec{v_1})\cdot(a_t \vec{v_0} + b_t \vec{v_1}) = a_t^2 + b_t^2 + 2a_tb_t(\vec{v_0}\cdot\vec{v_1})\\\ 
&= \frac{\sin^2(\alpha - t\alpha)}{\sin^2\alpha} + \frac{\sin^2(t\alpha)}{\sin^2\alpha} + \frac{2\sin(\alpha - t\alpha)\sin(t\alpha)\cos\alpha}{\sin^2\alpha}\\\ 
|OP_t|^2 \sin^2\alpha &= \sin^2(\alpha - t\alpha) + \sin^2(t\alpha) + 2\sin(\alpha - t\alpha)\sin(t\alpha)\cos\alpha\\\ 
&= 1-\frac{1}{2}(\cos(2\alpha - 2t\alpha) + \cos(2t\alpha)) + \cos\alpha(\cos(\alpha - 2t\alpha) - \cos\alpha)\\\ 
&= 1 - \cos\alpha\cos(\alpha - 2t\alpha) + \cos\alpha\cos(\alpha-2t\alpha) - \cos^2\alpha\\\ 
&= \sin^2\alpha
\end{aligned}
$$
所以 $|OP_t|$ 恒等于 $1$, 说明 $P_t$ 也在$P_0, P_1$所在的大圆上.


