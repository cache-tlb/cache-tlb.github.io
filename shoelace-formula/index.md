# Shoelace 公式


已知平面上简单多边形的顶点坐标为 $P_0, P_1, \cdots, P_{N-1}$, 求其面积.

设多边形区域为 $\Omega$, 则面积为
$$
A = \iint_\Omega {1}\ \mathrm{d}x\mathrm{d}y
$$

令 $P = 0, Q = x$, 则有 $\dfrac{\partial Q}{\partial x} - \dfrac{\partial P}{\partial y} = 1$, 根据格林公式可得
$$
\begin{aligned} 
A &= \iint_\Omega {\left( \frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y} \right)}\ \mathrm{d}x\mathrm{d}y \\\ 
&= \oint_{\partial\Omega} P\mathrm{d}x + Q\mathrm{d}y\\\ 
&= \oint_{\partial\Omega} x\mathrm{d}y\\\ 
&= \sum_{i=0}^{N-1} \int_{P_iP_{i+1}} x\ \mathrm{d}y
\end{aligned} 
$$
其中 $P_N = P_0$. 
这里用格林公式将闭区域$\Omega$上的二重积分转换成沿着区域边界 $\partial\Omega$ 上的线积分, 然后将沿着闭曲线的线积分拆成逐段积分之和.

对于多边形的每一条边$P_{i}P_{i+1}$, 参数方程为:
$$
x = (x_{i+1}-x_i)t + x_i, \ \ y = (y_{i+1}-y_i)t + y_i, \qquad t\in[0,1].
$$
于是 $x\ \mathrm{d}y = ((x_{i+1}-x_i)t+x_i)(y_{i+1}-y_i)\ \mathrm{d}t$, 
$$
\begin{aligned} 
\int_{P_iP_{i+1}} x\ \mathrm{d}y &= \int_0^1 ((x_{i+1}-x_i)t+x_i)(y_{i+1}-y_i)\ \mathrm{d}t\\\ 
&= \frac{1}{2}(x_{i+1}-x_i)(y_{i+1}-y_i) + x_i(y_{i+1}-y_i) \\\ 
&= \frac{1}{2}(x_{i+1}+x_i)(y_{i+1}-y_i) \\\ 
&= \frac{1}{2}(x_i y_{i+1}-x_{i+1} y_i + x_{i+1}y_{i+1}-x_i y_i)
\end{aligned} 
$$

将它代入上面的求和式, 并注意到 $\displaystyle \sum_{i=0}^{N-1}x_iy_i = \sum_{i=0}^{N-1}x_{i+1}y_{i+1} $, 可得
$$
\begin{aligned} 
A &= \sum_{i=0}^{N-1} \int_{P_iP_{i+1}} x\ \mathrm{d}y \\\ 
&= \frac{1}{2}\sum_{i=0}^{N-1}{x_i y_{i+1}-x_{i+1} y_i + x_{i+1}y_{i+1}-x_i y_i}\\\ 
&= \frac{1}{2}\left(\sum_{i=0}^{N-1} (x_i y_{i+1}-x_{i+1} y_i) + \sum_{i=0}^{N-1} x_{i+1}y_{i+1} - \sum_{i=0}^{N-1} x_i y_i\right)\\\ 
&= \frac{1}{2}\sum_{i=0}^{N-1} (x_i y_{i+1}-x_{i+1} y_i)
\end{aligned} 
$$



