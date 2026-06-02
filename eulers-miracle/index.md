# 欧拉的奇迹


本文参考了 William Dunham 所著的 "Euler's Miracle" 一文（[本地存档](./EulersMiracle.pdf)）. 该文分析了一种交错的调和级数.
虽然调和级数是发散的, 欧拉改变了调和级数的某些项的符号, 得到了收敛的结果, 并且收敛值正好是 $ \pi $.

### 欧拉交错级数

这里讨论的级数定义如下:
$$
\begin{align*}
E &= 1 + \frac{1}{2} + \frac{1}{3} + \frac{1}{4} - \frac{1}{5} + \frac{1}{6} + \frac{1}{7} + \frac{1}{8} + \frac{1}{9} - \frac{1}{10} \\\ 
& + \frac{1}{11} + \frac{1}{12} - \frac{1}{13} + \frac{1}{14} - \frac{1}{15} + \frac{1}{16} - \frac{1}{17} + \frac{1}{18} + \frac{1}{19} - \frac{1}{20} \\\ 
& + \frac{1}{21} + \frac{1}{22} + \frac{1}{23} + \frac{1}{24} + \frac{1}{25} - \frac{1}{26} + \frac{1}{27} + \frac{1}{28} - \frac{1}{29} - \frac{1}{30} \\\ 
& + \frac{1}{31} + \frac{1}{32} + \frac{1}{33} - \frac{1}{34} - \frac{1}{35} + \cdots
\end{align*}
$$
改变符号的规则为: 对于任意正整数 $ n $, 如果 $n$ 含有奇数个形如 $ 4k + 1$ 的素因子(包含重复的), 那么 $\dfrac{1}{n} $ 的符号就是负的.

为了证明这个结论, 欧拉使用了 4 条已有的结论. 
- Leibniz 级数: 
$$ 1-\frac{1}{3}+\frac{1}{5}-\frac{1}{7} + \cdots =\frac{\pi}{4} $$
- 巴塞尔问题: 
$$ 1+\frac{1}{2^2}+\frac{1}{3^2}+\cdots = \frac{\pi^2}{6} $$
- 几何级数的求和:
$$ 1 + a + a^2 + a^3 + \cdots = \frac{1}{1-a}, \quad -1 < a < 1 $$
- 算术基本定理或正整数唯一分解定理: 任何一个大于1的自然数, 如果它不为质数，那么它可以唯一分解成有限个质数的乘积.

### Leibniz 级数的乘积形式

欧拉的证明过程是先将 Leibniz 级数公式与它自身的 $\dfrac{1}{3}$ 相加:
$$
\begin{align*}
\frac{\pi}{4} &= 1-\frac{1}{3}+\frac{1}{5}-\frac{1}{7} +\frac{1}{9} - \frac{1}{11} + \frac{1}{13} - \frac{1}{15} + \frac{1}{17} - \frac{1}{19} + \frac{1}{21} - \frac{1}{23} +\cdots \\\ 
\frac{1}{3}\cdot\frac{\pi}{4} &= \frac{1}{3}-\frac{1}{9}+\frac{1}{15}-\frac{1}{21}+\cdots \\\ 
\frac{\pi}{4}(1+\frac{1}{3})&=1+\frac{1}{5}-\frac{1}{7}-\frac{1}{11}+\frac{1}{13}+\frac{1}{17}-\frac{1}{19}-\frac{1}{23}+\cdots
\end{align*}
$$
最后一个式子里, 分母为 3 的倍数的项被消去了. 接着再减去上面最后一个等式的 $\dfrac{1}{5}$, 得到:
$$
\begin{align*}
\frac{\pi}{4}(1+\frac{1}{3})&=1+\frac{1}{5}-\frac{1}{7}-\frac{1}{11}+\frac{1}{13}+\frac{1}{17}-\frac{1}{19}-\frac{1}{23}+\cdots \\\ 
\frac{1}{5}\cdot\frac{\pi}{4}(1+\frac{1}{3}) &= \frac{1}{5} + \frac{1}{25} - \frac{1}{35} - \cdots \\\ 
\frac{\pi}{4}(1+\frac{1}{3})(1-\frac{1}{5})&=1-\frac{1}{7}-\frac{1}{11}+\frac{1}{13}+\frac{1}{17}-\frac{1}{19}-\frac{1}{23}+\cdots
\end{align*}
$$
这里, 分母是 3 和 5 的倍数的项都没了. 如此, 再加上上面式子的 $\dfrac{1}{7}$:
$$
\frac{\pi}{4}(1+\frac{1}{3})(1-\frac{1}{5})(1+\frac{1}{7}) = 1- \frac{1}{11}+\frac{1}{13}+\frac{1}{17}-\frac{1}{19} - \frac{1}{23} + \cdots
$$

以此类推, 每一步等式右边开头都是 $ 1\pm\dfrac{1}{p} $ 的形式, 其中 $ p $ 是一个质数. 无限重复下去, 根据 $\dfrac{1}{p}$ 在 Leibniz 级数中的正负号决定下一步乘上的是 $(1+\dfrac{1}{p})$ 还是 $(1-\dfrac{1}{p})$. Leibniz 级数中的正负号规律很容易看出来, $\dfrac{1}{4k+1}$ 是加号, $\dfrac{1}{4k+3}$ 是减号. 于是, 将上面的过程无限重复, 将得到: 
$$
\frac{\pi}{4}(1+\frac{1}{3})(1-\frac{1}{5})(1+\frac{1}{7})(1+\frac{1}{11})(1-\frac{1}{13})(1-\frac{1}{17})(1+\frac{1}{19}) \cdots = 1
$$ 
或者写成:
$$
(1+\frac{1}{3})(1-\frac{1}{5})(1+\frac{1}{7})(1+\frac{1}{11})(1-\frac{1}{13})(1-\frac{1}{17})(1+\frac{1}{19}) \cdots = \frac{4}{\pi}
$$

如此就把求和形式的 Leibniz 级数转成了乘积形式.

### 巴塞尔问题的乘积形式

考虑下面的分式, 分母中各项里的分数的分母包含了所有质数:
$$
Q = \frac{1}{(1+\frac{1}{2})(1-\frac{1}{2})(1+\frac{1}{3})(1-\frac{1}{3})(1+\frac{1}{5})(1-\frac{1}{5})(1+\frac{1}{7})(1-\frac{1}{7})(1+\frac{1}{11})(1-\frac{1}{11})\cdots}
$$

欧拉将它的相邻项两两结合, 并使用几何级数展开:
$$
\begin{align*}
Q &= \frac{1}{1-\frac{1}{4}}\cdot\frac{1}{1-\frac{1}{9}}\cdot\frac{1}{1-\frac{1}{25}}\cdot\frac{1}{1-\frac{1}{49}}\cdot\frac{1}{1-\frac{1}{121}}\cdot\frac{1}{1-\frac{1}{169}}\cdot\cdots \\\ 
 &= \left(1+\frac{1}{4}+\frac{1}{4^2}+\cdots\right)\left(1+\frac{1}{9}+\frac{1}{9^2}+\cdots\right)\left(1+\frac{1}{25}+\cdots\right)\left(1+\frac{1}{49}+\cdots\right)\cdots
\end{align*}
$$
可以断言, 巴塞尔问题中的任意一项 $ \dfrac{1}{N^2}$会在这个乘积中出现且仅出现一次. 这是因为 $ N $ 可以被唯一地表示成质数的乘积: $ N = \prod p_i^{k_i} $, 其中 $ p_i $ 是第 $ i $ 个质数, $ k_i $ 是自然数.
则 $ N^2 = \prod (p_i^2)^{k_i} $. 每个 $ N $ 对应一组 $\{k_i\}$ 的序列, 且该序列非零项个数是有限的. 而这样的序列一一对应了上面乘积展开式中的一项. 于是
$$Q = 1 + \frac{1}{4} + \frac{1}{9} + \frac{1}{16} + \cdots = \frac{\pi^2}{6} .$$

或者写成
$$(1+\frac{1}{2})(1-\frac{1}{2})(1+\frac{1}{3})(1-\frac{1}{3})(1+\frac{1}{5})(1-\frac{1}{5})(1+\frac{1}{7})(1-\frac{1}{7})\cdots= \frac{1}{Q} = \frac{6}{\pi^2}$$

左边是 $(1\pm\frac{1}{p})$ 形式的乘积, $p$ 为质数.

### 证明结论

得到了前述的 Leibniz 级数和巴塞尔问题的乘积形式后, 将二者相除, 再乘以 $ \dfrac{3}{2} $, 得到
$$
\begin{align*}
 \pi &= \frac{3}{2}\left(\frac{4/\pi}{6/\pi^2}\right) \\\ 
&=  \frac{3}{2}\left(\frac{(1+\frac{1}{3})(1-\frac{1}{5})(1+\frac{1}{7})(1+\frac{1}{11})(1-\frac{1}{13})(1-\frac{1}{17})(1+\frac{1}{19})\cdots}{(1+\frac{1}{2})(1-\frac{1}{2})(1+\frac{1}{3})(1-\frac{1}{3})(1+\frac{1}{5})(1-\frac{1}{5})(1+\frac{1}{7})(1-\frac{1}{7})\cdots}\right) \\\ 
&= \frac{1}{1-\frac{1}{2}}\cdot\frac{1}{1-\frac{1}{3}}\cdot\frac{1}{1+\frac{1}{5}}\cdot\frac{1}{1-\frac{1}{7}}\cdot\frac{1}{1-\frac{1}{11}}\cdot\frac{1}{1+\frac{1}{13}}\cdot\frac{1}{1+\frac{1}{17}}\cdot\frac{1}{1-\frac{1}{19}}\cdots
\end{align*}
$$
可以发现, 最后的式子中, 对于奇素数 $ p $, 如果 $p$ 是 $4k+1$ 的形式, 则对应 $\left(1+\dfrac{1}{p}\right)^{-1}$ 的项; 如果 $p$ 是 $4k+3$ 的形式, 则对应 $\left(1-\dfrac{1}{p}\right)^{-1}$ 的项.

继续应用几何级数展开, 得到
$$
\begin{align*}
\pi = & \left(1+\frac{1}{2}+\frac{1}{2^2}+\cdots\right)\times\left(1+\frac{1}{3}+\frac{1}{3^2}+\cdots\right)\times\left(1-\frac{1}{5}+\frac{1}{5^2}-\cdots\right)\times\\\ 
& \left(1+\frac{1}{7}+\frac{1}{7^2}+\cdots\right)\times\left(1+\frac{1}{11}+\frac{1}{11^2}+\cdots\right)\times\left(1-\frac{1}{13}+\frac{1}{13^2}-\cdots\right)\times\cdots
\end{align*}
$$

这些乘积中的每一个级数, 有些全是加号, 有些是加减号交错的. 将乘积展开就能得到调和级数的每一项, 并且是一一对应的. 如果分母恰有奇数个 $4k+1$ 形式的素因数, 在欧拉交错级数中就是减号; 否则就是加号.
