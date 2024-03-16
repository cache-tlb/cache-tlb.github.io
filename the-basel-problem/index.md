# 巴塞尔问题


巴塞尔问题将自然数和圆周率这两个看似风马牛不相及的概念联系在了一起：

$$ \zeta(2)= \frac{1}{1^2} +  \frac{1}{2^2} +  \frac{1}{3^2} +  \cdots = \frac{\pi^2}{6} . $$

这里的$\zeta(s)$是黎曼$\zeta$函数。如何用初等方法证明它呢？

<br/>

## 欧拉的解法

考虑下述函数 $ f(x) $ 的泰勒展开: 

$$ f(x) = \frac{\sin x}{x} = 1 - \frac{x^2}{3!} + \frac{x^4}{5!} + \cdots ,$$ 
另一方面, $ f(x) = 0 $ 的根为 $ x = \pm k\cdot \pi $, 所以 $ f(x) $ 又可以表示为:
$$ f(x) = A(1-\frac{x}{\pi}) (1+\frac{x}{\pi}) (1-\frac{x}{2\pi}) (1+\frac{x}{2\pi}) \cdots ,$$ 
这里 $ A $ 是待定系数, 通过代入 $ x = 0 $ 可得 $ A = 1 $, 在对相邻两项用平方差公式，得到: 
$$ f(x) = (1-\frac{x^2}{\pi^2}) (1-\frac{x^2}{4\pi^2}) (1-\frac{x^2}{9\pi^2}) \cdots ,$$ 
比较这两种表达方式的二次项系数, 可得
$$ -\frac{1}{3!} = -(\frac{1}{\pi^2} + \frac{1}{4\pi^2} + \frac{1}{9\pi^2} + \cdots) ,$$
整理之后可得
$$ \frac{\pi^2}{6} = 1 + \frac{1}{4} + \frac{1}{9} + \frac{1}{16} + \cdots $$

<br/>

## 柯西的解法

这是我在Wikipedia上看来的，[链接在此](https://en.wikipedia.org/wiki/Basel_problem#Cauchy's_proof)。比欧拉的解法更严谨。

注意到当 $ 0 < \theta < \pi/2 $ 时, 有 
$$ \sin\theta < \theta < \tan\theta ,$$ 或取平方倒数得到 $$ \cot^2\theta < \dfrac{1}{\theta^2} < \csc^2\theta .$$ 

证明的思路是将所求的正整数倒数的平方和夹在两个求和式之间, 并且上下界都趋于 $ \pi^2/6 $.
令 $ 0 < x < \pi/2 $, $ n $ 是正整数, 引入复数运算: 
$$
\begin{aligned} 
\frac{\cos(nx)+i\sin(nx)}{(\sin x)^n} &= \frac{(\cos x+i\sin x)^n}{(\sin x)^n} \\\ 
&= \left( \frac{\cos x+i\sin x}{\sin x} \right)^n \\\ 
&= (\cot x + i)^n 
\end{aligned}
$$

二项式展开:
$$
\begin{aligned}
(\cot x + i)^n &= C_n^0\cot^n x + C_n^1(\cot^{n-1}x)i + \cdots + C_n^{n-1}(\cot x)i^{n-1} + C_n^n i^n \\\ 
&= \left[ C_n^0\cot^n x - C_n^2\cot^{n-2} x \pm\cdots \right] + i\left[ C_n^1\cot^{n-1} x - C_n^3\cot^{n-3} x \pm\cdots \right]
\end{aligned}
$$

这两个复数的实部和虚部应该对应相等, 于是:
$$ \frac{\sin(nx)}{(\sin x)^n} = C_n^1\cot^{n-1} x - C_n^3\cot^{n-3} x \pm\cdots $$

设 $ n = 2m+1 $, 并考虑 $ x_r = \dfrac{r\pi}{2m+1} $, 其中 $ r = 1,2,\cdots,m $, 那么 $ nx_r $ 是 $ \pi $ 的倍数, 意味着 $ x_r $ 是上面式子的零点, 代入上面的式子得:
$$ 0 = C_{2m+1}^1\cot^{2m}x_r - C_{2m+1}^3\cot^{2m-2}x_r \pm\cdots + (-1)^m C_{2m+1}^{2m+1} $$
当 $ r $ 取不同的值时, $ x_r $ 是 $ (0, \pi/2) $ 区间上不同的数, 容易看出 $ \cot^2 x_r $ 也是互不相同的. 令 $ t_r = \cot^2 x_r $, 则 $ t_r $ 是下面 $ m $ 次多项式的根:
$$
\begin{aligned} 
p(t) &= C_{2m+1}^1t^m - C_{2m+1}^3t^{m-1} \pm\cdots + (-1)^m C_{2m+1}^{2m+1} \\\ 
	&= A(t-t_1)(t-t_2)\cdots(t-t_m)\\\ 
	&= At^m - A(t_1+t_2+\cdots+t_m)t^{m-1} + \cdots
\end{aligned}
$$
比较 $ t^m $ 和 $ t^{m-1} $ 两项的系数可得: $ C_{2m+1}^1(t_1+t_2+\cdots+t_m)=C_{2m+1}^3 $, 所以
$$ \cot^2x_1+\cot^2x_2+\cdots+\cot^2x_m=t_1+t_2+\cdots+t_m=\frac{C_{2m+1}^3}{C_{2m+1}^1}=\frac{2m(2m-1)}{6}$$

另一方面, 根据三角恒等式 $ \csc^2 x = \cot^2 x + 1 $, 得:
$$ \csc^2x_1+\csc^2x_2+\cdots+\csc^2x_m=\frac{2m(2m-1)}{6}+m = \frac{2m(2m+2)}{6} $$

根据前面的不等式 $ \cot^2x<\dfrac{1}{x^2}<\csc^2x $, 因为 $ \dfrac{1}{x_r^2} = \dfrac{(2m+1)^2}{(r\pi)^2} $, 则
$$ \frac{2m(2m-1)}{6} < \frac{(2m+1)^2}{\pi^2}+\frac{(2m+1)^2}{(2\pi)^2}+\cdots+\frac{(2m+1)^2}{(m\pi)^2} < \frac{2m(2m+2)}{6}. $$
这个不等式乘上 $ \dfrac{\pi^2}{(2m+1)^2} $, 得:
$$ \frac{2m(2m-1)\pi^2}{6(2m+1)^2} < \frac{1}{1^2}+\frac{1}{2^2}+\cdots+\frac{1}{m^2} < \frac{2m(2m+2)\pi^2}{6(2m+1)^2}. $$

当 $ m $ 趋于正无穷时, 两端的值都趋于 $ \dfrac{\pi^2}{6} $, 所以 
$$ \zeta(2)=\sum_{k=1}^{\infty}{\frac{1}{k^2}} =\frac{\pi^2}{6}. $$

## 几何方法

这是从 3blue1brown 那里看到的，[链接在此](https://www.youtube.com/watch?v=d-o3eB9sfls)。

考虑原点上有一个感光元件, 有一系列一样的单位亮度的灯, 距离原点为 $ d $ 时, 感光元件接收到的光强度是 $ \dfrac{1}{d^2} $.

先证一个引理: 如下图所示, 直角三角形 $ ABC $, 感光元件在直角 $ C $ 上, 直角边长为 $ a $ 和 $ b $, 斜边上的高长 $ h $. 

<center>
{{< tikz >}}  
\begin{tikzpicture}[]
\definecolor{rvwvcq}{rgb}{0.08235294117647059,0.396078431372549,0.7529411764705882}
\definecolor{wrwrwr}{rgb}{0.3803921568627451,0.3803921568627451,0.3803921568627451}
\coordinate[label=left:$C$] (C) at (0,0);
\coordinate[label=above:$B$] (B) at (0,3);
\coordinate[label=right:$A$] (A) at (4,0);
\coordinate[label=above right:$D$] (D) at (1.44,1.92);

%\tkzMarkRightAngle[line width=1pt](A,C,B);
%\tkzMarkRightAngle[line width=1pt](C,D,A);

\draw [line width=1pt] (C) to [edge label=$a$] (B);
\draw [line width=1pt] (A) to [edge label=$b$] (C);
\draw [line width=1pt] (A)-- (B);
\draw [line width=1pt,dash pattern=on 3pt off 3pt] (C) to [edge label=$h$] (D);

\foreach \p in {A,B,C,D}
	\fill[fill=rvwvcq,thick] (\p) circle (1.25pt);
\end{tikzpicture}
{{< /tikz >}}
</center>

根据勾股定理和面积关系, 可以推出:
$$
\begin{aligned}
ab &= ch \\\ 
a^2b^2 &= c^2h^2\\\ 
\frac{1}{h^2} &= \frac{c^2}{a^2b^2}=\frac{a^2+b^2}{a^2b^2}\\\ 
\frac{1}{h^2} &= \frac{1}{a^2} + \frac{1}{b^2}
\end{aligned}
$$
这意味着当斜边上的垂足上有一个单位亮度的灯时, 感光元件接收的光强等于两个直角顶点上各有一个单位亮度灯时的光强.

现在假定感光元件位于原点 $ O $ 处, 一个小圆的圆心在 $ y $ 轴上, $ OA $ 为直径, 直径是 $ 2/\pi $, 周长为 2. 点 $ A $ 处有一个灯, 则 $ O $ 点的亮度为 $ \pi^2/4 $. 

在小圆外面画一个稍大一点的圆, 直径是小圆的两倍, 两圆内切于 $ O $ 点, 过点 $ A $ 作小圆的切线, 与大圆交于 $ B, C $ 两点. 点 $ OBC $ 构成直角三角形, $ BC $ 是斜边, $ A $ 是斜边上的垂足, 对 $ O $ 点而言, 在 $ B, C $ 两点上各放一个灯, 和在 $ A $ 点放一个灯的亮度是一样的. 

继续在大圆外面画一个更大的圆, 直径是前一个圆的两倍, 为 $ 8/\pi $, 同样与上一个圆相切于 $ O $ 点. 过新的大圆圆心分别作过 $ B $ 和 $ C $ 的直径, 两直径的端点分别是 $ D, E, F, G $, 容易证明这 4 个点平分了圆周. 考虑过 $ C $ 点的直径 $ FD $, $ OFD $ 三点构成直角三角形, $ \angle FOD $ 是直角. 另一方面, $ \angle FCO $ 是第二个圆的直径所对的圆周角, 从而 $ OC $ 是 $ FD $ 上的高. 于是对于 $ O $ 来说, $ C $ 点有一个灯, 等价于 $ F $ 和 $ D $ 上各有一个灯. 同理, $ B $ 点有一盏灯等价于 $ E $ 和 $ G $ 各有一盏灯, 所以 $ DEFG $ 的亮度之和等于 $ A $ 的亮度.

<table border="0">
<tr>
<td>
<center>
{{< tikz >}}  
\definecolor{wrwrwr}{rgb}{0.3803921568627451,0.3803921568627451,0.3803921568627451}
\definecolor{rvwvcq}{rgb}{0.08235294117647059,0.396078431372549,0.7529411764705882}
\begin{tikzpicture}[scale=2]
\clip(-1.25,-0.3) rectangle (1.25,2.15);
\coordinate[label=below left:$O$] (O) at (0,0);
\coordinate (C1) at (0,0.5);
\coordinate[label=above left:$A$] (A) at (0,1);
\coordinate[label=left:$B$] (B) at (-1,1);
\coordinate[label=right:$C$] (C) at (1,1);
\draw [line width=1pt] (A) circle (1cm);
\draw [line width=1pt] (C1) circle (0.5cm);
\draw [line width=1pt] (-2.2,0)--(3.1,0);
\draw [line width=1pt] (0,-0.7) -- (0,3.18);
\draw [line width=1pt,dash pattern=on 3pt off 3pt] (B)-- (C);
\foreach \p in {A,B,C,C1,O}
	\fill[fill=rvwvcq,thick] (\p) circle (0.75pt);
\end{tikzpicture} 
{{< /tikz >}}
</center>
</td>
<td>
<center>
{{< tikz >}}  
\definecolor{wrwrwr}{rgb}{0.3803921568627451,0.3803921568627451,0.3803921568627451}
\definecolor{rvwvcq}{rgb}{0.08235294117647059,0.396078431372549,0.7529411764705882}
\begin{tikzpicture}[scale=2]
\clip(-1.25,-0.3) rectangle (1.25,2.15);
\def\xx{0.7071067811865475}
\coordinate[label=below left:$O$] (O) at (0,0);
\coordinate[label=right:$B$] (B) at (-0.5,0.5);
\coordinate[label=left:$C$] (C) at (0.5,0.5);
\coordinate[label=135:$A$] (A) at (0,0.5);
\coordinate[label=right:$D$] (D) at (\xx,1-\xx);
\coordinate[label=right:$E$] (E) at (\xx,1+\xx);
\coordinate[label=left:$F$] (F) at (-\xx,1+\xx);
\coordinate[label=left:$G$] (G) at (-\xx,1-\xx);
\coordinate (C2) at (0,1);
\draw [line width=1pt] (C2) circle (1cm);
\draw [line width=1pt] (A) circle (0.5cm);
\draw [line width=1pt] (-2.2,0)--(3.1,0);
\draw [line width=1pt] (0,-0.7) -- (0,3.18);
\draw [line width=1pt,dash pattern=on 3pt off 3pt] (E)-- (G);
\draw [line width=1pt] (F)-- (D);
\draw [line width=1pt] (F)-- (O);
\draw [line width=1pt] (O)-- (D);
\draw [line width=1pt] (O)-- (C);
\foreach \p in {A,B,C,C2,O,E,F,G,D}
	\fill[fill=rvwvcq,thick] (\p) circle (0.75pt);
\end{tikzpicture} 
{{< /tikz >}}
</center>
</td>
</tr>

<tr>
<td>
<center>
{{< tikz >}}  
\definecolor{wrwrwr}{rgb}{0.3803921568627451,0.3803921568627451,0.3803921568627451}
\definecolor{rvwvcq}{rgb}{0.08235294117647059,0.396078431372549,0.7529411764705882}
\begin{tikzpicture}[scale=2]
\clip(-1.25,-0.3) rectangle (1.25,2.15);
\coordinate[label=below left:$O$] (O) at (0,0);
\coordinate (C3) at (0,1);
\coordinate (C2) at (0,0.5);
\foreach \idx/\lab in {1/P1,-1/P2,3/P3,-3/P4,5/P5,-5/P6,7/P7,-7/P8} {
	\coordinate (\lab) at ({0 + 1*cos(270+\idx*22.5)},{1 + 1*sin(270+\idx*22.5)});
	\fill[fill=wrwrwr,thick] (\lab) circle (0.75pt);
}
\foreach \idx/\lab in {1/D,-1/G,3/E,-3/F} {
	\coordinate (\lab) at ({0 + 0.5*cos(270+\idx*45)},{0.5 + 0.5*sin(270+\idx*45)});
	\fill[fill=wrwrwr,thick] (\lab) circle (0.75pt);
}
\draw [line width=1pt] (C3) circle (1cm);
\draw [line width=1pt] (C2) circle (0.5cm);
\draw [line width=1pt] (-2.2,0)--(3.1,0);
\draw [line width=1pt] (0,-0.7) -- (0,3.18);
\draw (0.2,0.46) node[anchor=north west] {$D$};
\draw (0.05,0.9) node[anchor=north west] {$E$};
\draw (-0.35,0.9) node[anchor=north west] {$F$};
\draw (-0.45,0.4) node[anchor=north west] {$G$};
\draw [line width=1pt,dash pattern=on 3pt off 3pt] (P3)-- (P6);
\draw [line width=1pt] (P6) -- (O)-- (P3);
\draw [line width=1pt] (O) -- (E);
\draw [fill=rvwvcq] (0,1) circle (0.75pt);
\draw [fill=wrwrwr] (0,0) circle (0.75pt);
\end{tikzpicture}
{{< /tikz >}}
</center>
</td>

<td>
<center>
{{< tikz >}}  
\definecolor{wrwrwr}{rgb}{0.3803921568627451,0.3803921568627451,0.3803921568627451}
\definecolor{rvwvcq}{rgb}{0.08235294117647059,0.396078431372549,0.7529411764705882}
\begin{tikzpicture}[line cap=round,line join=round,x=1cm,y=1cm,scale=2]
\clip(-1.25,-0.3) rectangle (1.25,2.15);
\coordinate[label=below left:$O$] (O) at (0,0);
\coordinate (C4) at (0,16);
\foreach \idx/\lab in {1/P1,-1/P2,3/P3,-3/P4,5/P5,-5/P6,7/P7,-7/P8} {
	\coordinate (\lab) at ({0 + 16*cos(270+\idx*0.5)},{16 + 16*sin(270+\idx*0.5)});
  	\draw [line width=1pt,dash pattern=on 3pt off 3pt] (C4) -- (\lab);
	\fill[fill=wrwrwr,thick] (\lab) circle (0.75pt);
}
\draw [line width=1pt] (-3.8,0) -- (3.4,0);
\draw [line width=1pt] (0,-0.58) -- (0,3.3);
\draw [line width=1pt] (C4) circle (16cm);
\end{tikzpicture}
{{< /tikz >}}
</center>
</td>
</tr>
</table>


继续在外面画一个更大的圆, 直径是上一个圆的两倍, 过 $ DEFG $ 作大圆的直径, 得到大圆的 8 个等分点, 类似的, 如果这 8 个点上各放一个灯, 它们的亮度之和与 $ A $ 点的亮度是一样的. 另外注意到这一系列圆上, 等分点之间的弧长都是 2.

这个过程一直进行下去, 随着圆越来越大, 曲率越来越小, 得到的等分点在极限情况下都会落在 $ x $ 轴上, 对应的坐标分别是 $ \pm1, \pm3, \cdots $. 这些灯的亮度之和依然是 $ \pi^2/4 $. 即:
$$ \frac{1}{1^2} + \frac{1}{3^2} + \frac{1}{5^2} + \cdots = \frac{\pi^2}{8}. $$
经过简单的代换:
$$
\begin{aligned}
\zeta(2) - \frac{1}{4}\zeta(2) &= \left( \frac{1}{1^2} + \frac{1}{2^2} + \frac{1}{3^2} + \cdots \right) - \left( \frac{1}{2^2} + \frac{1}{4^2} + \frac{1}{6^2} + \cdots \right)\\\ 
\frac{3}{4}\zeta(2) &= \frac{1}{1^2} + \frac{1}{3^2} + \frac{1}{5^2} + \cdots = \frac{\pi^2}{8} \\\ 
\zeta(2) &= \frac{\pi^2}{6}
\end{aligned}
$$

