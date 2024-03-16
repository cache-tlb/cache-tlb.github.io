# 压垮骆驼的最后一根稻草


## 问题

骆驼最大负重为 $1$，有一堆稻草，每一根稻草的重量都是 $(0, 1)$ 上独立的均匀分布。依次往骆驼的背上放稻草，直到总重量超过 $1$，这时骆驼就被压垮了。

问：骆驼被压垮时，平均身上有多少根稻草？稻草总重量的期望是多少？以及最后压垮骆驼的那一根稻草的重量期望是多少？

## 稻草数量

第一个问题最经典，经常出现在各大金融 / 科技 / 互联网公司的笔试和面试题中。我们假设第 $i$ 根稻草重量为 $x_i$, 恰好压垮骆驼的稻草数量为 $n$，考虑 $n \ge k$ 的概率 $P(n \ge k)$ 的计算方法。

例如，$n \ge 2$ 意味着 $x_1 < 1$，这是显然成立的，故 $P(2) = 1$。

$n \ge 3$ 意味着 $x_1 + x_2 < 1$，以 $x_1,x_2$ 为两坐标轴，三条直线 $x_1 > 0, x_2 > 0, x_1 + x_2 < 1$ 围成的区域的面积就是对应的概率，为 $\dfrac{1}{2}$。

$n \ge 4$ 意味着 $x_1 + x_2 + x_3< 1$，它的概率是四个平面 $x_1 > 0, x_2 > 0, x_3 > 0, x_1+x_2+x_3 < 1$ 围成的三棱锥的体积，为 $\dfrac{1}{6}$。

以此类推，$n \ge k + 1$ 的概率为 $\dfrac{1}{k!}$。所以稻草数量的期望为 
$$
\begin{aligned}
E(n) &= 1\cdot P(n=1) + 2\cdot P(n=2) + 3\cdot P(n=3) \cdots\\\ 
&= 1\cdot( P(n\ge 1) -  P(n\ge 2)) + 2\cdot( P(n\ge 2) -  P(n\ge 3)) + \cdots\\\ 
&=  P(n\ge 1) +  P(n\ge 2) +  P(n\ge 3) + \cdots \\\ 
&= 1 + 1 + \frac{1}{2!} + \frac{1}{3!} + \cdots \\\ 
&= e
\end{aligned}
$$

也可以用动态规划的思路，定义 $F(x)$ 为骆驼剩余的负重还有 $x$ ，到被压垮时背上还能再放的稻草根数的期望值，这里 $x$ 限制在 $[0, 1]$ 范围。则要求的就是 $F (1)$。 为了求一般的 $F (x)$ 的值，考虑选取的第一根稻草重量, 分两种情况讨论：

(1) 若选取的第一根稻草重量大于 $x$，概率为 $1 − x$，放一根稻草就压垮了。

(2) 若选取的第一根稻草重量小于等于 $x$，例如重量为 $t$，概率为 $\mathrm{d}t$，则从期望上来看为要放 $1 + F (x − t)$ 根稻草才能压垮。

两种情况加起来得：
$$
\begin{aligned}
F(x) &= (1-x)\cdot 1 + \int_0^x\left(1 + F(x-t)\right)\ \mathrm{d}t \\\ 
&= 1 + \int_0^x F(x-t)\ \mathrm{d}t \\\ 
&= 1 + \int_0^x F(t)\ \mathrm{d}t
\end{aligned}
$$
两边求导得 $F'(x) = F(x)$，并且初值为 $F (0) = 1$，解得 $F (x) = e^x$， 于是 $F (1) = e$。

## 稻草总重量

仍然假设第 $i$ 根稻草重量为 $x_i$，$S_k$ 为前 $k$ 根稻草的重量之和。设函数 $W(x)$ 为稻草重量之和恰好超过 $x$ 时的实际总重量的期望，$ x\in[0,1] $，即
$$
W(x) = E(S_n | S_{n-1} < x, S_n > x) .
$$
类似的分两种情况讨论：

(1) 第一根稻草重量就超过了 $x$，例如 $x_1 = t > x$，这部分的期望为：
$$
E(x_1 | x_1 > x) = \int_x^1 t\ \mathrm{d}t = \frac{1-x^2}{2}
$$

(2) 第一根稻草重量小于 $x$, 例如 $x_1 = t < x$，需要递归考虑 $W(x - t)$的值，这部分的期望为：
$$
E(S_n | x_1 < x, S_{n-1} < t, S_n > t) = \int_0^x \left(t + W(x - t)\right)\ \mathrm{d}t = \frac{t^2}{2} + \int_0^x W(t)\ \mathrm{d}t
$$

两部分合起来得：
$$
W(x) =  \frac{1-x^2}{2} +  \frac{t^2}{2} + \int_0^x W(t)\ \mathrm{d}t = \frac{1}{2} + \int_0^x W(t)\ \mathrm{d}t
$$
将$x=0$代入可得初值为$W(0) = \dfrac{1}{2}$；此外对两边求导可得 $W'(x) = W(x)$，从而解得 $W(x) = \dfrac{e^x}{2}$。我们可以知道，骆驼被压垮时，背上的稻草总重量期望是 $\dfrac{e}{2}$。

## 最后一根稻草

虽然所有稻草都满足相同的分布，最后这跟稻草看似与其他的没什么两样，但从另一个角度考虑，重量越大的稻草越有可能成为压垮骆驼的最后一根。
依然假设第 $i$ 根稻草重量为 $x_i$，前 $n$ 根稻草重量之和为 $s_n$，定义函数$g_n(x)$ 为前 $n$ 根稻草重量之和不超过 $x$ 的概率，这里 $x\in[0,1]$。由前面的推理可知它就是 $n$ 维单位立方体中截取一个棱锥的体积，
$$
g_n(x) = \mathrm{Prob}(s_n < x) = \frac{x^n}{n!}
$$
再定义函数 $f_n (x)$ 为事件 $s_n < 1 < s_n + x$ 发生的概率，即取了 $n$ 个稻草没有达到最大负重，但再取一个重量为 $x$ 的稻草就会超重。 将事件拆成两个不等式，再重新改写一下就是 $1 − x < s_n < 1$，可见有
$$
\begin{aligned}
f_n (x) &= \mathrm{Prob}(s_n < 1) − \mathrm{Prob}(s_n < 1 − x) \\\ 
&= g_n (1) − g_n (1 − x) \\\ 
&= \frac{1-(1-x)^n}{n!} .
\end{aligned}
$$
对所有的 $n$ 求和得到最后一根稻草重量为 $x$ 的概率为
$$
f(x) = \sum_{n=0}^\infty f_n(x) = e - e^{1-x} .
$$

$f(x)$ 就是最后一根稻草重量的 pdf，它并不是均匀分布，它的期望值为：
$$
E = \int_0^1 x\cdot f(x)\ \mathrm{d}x =  \int_0^1 x\cdot (e - e^{1-x} )\ \mathrm{d}x = 2 - \frac{e}{2} \approx 0.64086 .
$$
期望值大于 0.5，说明最后一根稻草平均来说是比普通稻草更重一些的。

## 寓意

在人际关系乃至商业或者国际关系中，朋友之间难免会有伤害、冲突、冒犯，如果一次严重的冒犯会给对方永久累加一个随机的不满值，那么平均只要累加 2.78 次，就会让不满值爆表，而导致关系破裂。所谓“事不过三”大概就是这个意思。
当关系破裂时，冒犯的一方会辩解说：我也只是跟平时一样，你没有必要反应这么大吧。从某种意义上而言“跟平时一样”其实也没说错，最后一次跟以前都是采样同一个分布，没有区别。但不能因此而指责对方反应太大，因为最后一次冒犯的严重程度确实是大于平时的。


## 推广

如果骆驼最大的负重与稻草的最大重量相等时，骆驼平均只能承受 2.78 根稻草。仍然假设每一根稻草的重量都是 $(0, 1)$ 上独立的均匀分布，但骆驼负重的上限不是 $1$，情况会怎样？前面的分析已经包含了上限小于 $1$ 的情况，但不能简单推广到上限大于 $1$ 的情况。

例如假设骆驼负重上限是 $x$，求恰好压垮骆驼的稻草数量 $n$ 的期望，讨论 $P(n\ge 3)$，亦即 $x_1+x_2 < x$ 的概率，
需要计算 $x_1 > 0, x_1 < 1, x_2 > 0, x_2 < 1, x_1 + x_2 < x$ 这五个半平面的相交区域的面积，若 $x \le 1$ 时， $x_i < 1$ 的半平面约束可以去掉，相交区域还是等腰直角三角形，面积为 $\dfrac{1}{2}x^2$。若 $x > 1$，相交区域就不再是三角形了，因而不能说概率 $ x_1+x_2 < x$ 的概率还是 $\dfrac{1}{2}x^2$。

对于高维的情况，相交区域的形状更复杂，例如 $x_1+x_2+x_3 < 1.5$ 的边界面与立方体每个面都相交，对应的体积比较难算。

用动态规划+积分方程的思路如何呢？
仍然定义 $F(x)$ 为骆驼负重上限为 $x$ ，被压垮时承受的稻草根数的期望，据前面的分析， 当 $x \in [0, 1]$ 时，$F (x) = e^x$。
当 $x > 1$ 时，不可能第一根就超负重。设第一根稻草重量为 $t \in [0,1]$，需要根据 $F (x − t)$ 的值推出来，最远需要知道 $F(x - 1)$ 的值。因此从 $F(X)$ 在 $[0,1]$ 的表达式可以推出它在 $[1,2]$ 上的表达式，进而可以依次推出 $[2,3],[3,4],\cdots$ 等各个区间的表达式。

设 $F(x)$ 在 $x\in[1,2]$ 上的表达式为 $F_1(x)$，$x-t$ 可能小于 $1$，也可能大于 $1$，两种情况分开写，并记 $F(x)$ 在 $[0,1]$ 上的表达式为 $F_0(x)=e^x$，得：
$$
\begin{aligned}
F(x) &= \int_0^1(1+F(x-t))\ \mathrm{d}t, \ \ x\in[1,2] \\\ 
F_1(x) &= 1 + \int_0^{x-1}F_1(x-t)\ \mathrm{d}t + \int_{x-1}^1 F_0(x-t)\ \mathrm{d}t \\\ 
&= 1 + \int_1^x F_1(t)\ \mathrm{d}t + \int_{x-1}^1 F_0(t)\ \mathrm{d}t
\end{aligned}
$$

对 $F_1(x)$ 求导得 $F_1'(x) = F_1(x) - F_0(x-1) $，解得 $F_1(x) = Ce^x-xe^{x-1}$，根据初值条件 $F_1(1) = e$ 得 
$$
F_1(x) = (e+1-x)e^{x-1} = e^x - (x-1)e^{x-1}.
$$

继续求 $x\in[2,3]$ 上的表达式 $F_2(x)$，当 $t\in[0,1]$ 时 $x - t$ 值一定大于 $1$，因此按大于 $2$ 和小于 $2$ 讨论：
$$
\begin{aligned}
F(x) &= \int_0^1(1+F(x-t))\ \mathrm{d}t, \ \ x\in[2,3] \\\ 
F_2(x) &= 1 + \int_0^{x-2}F_2(x-t)\ \mathrm{d}t + \int_{x-2}^1 F_1(x-t)\ \mathrm{d}t \\\ 
&= 1 + \int_2^x F_2(t)\ \mathrm{d}t + \int_{x-1}^2 F_1(t)\ \mathrm{d}t
\end{aligned}
$$
求导得 $ F_2'(x) = F_2(x) - F_1(x-1) $，初值为 $F_2(2) = e^2-e$，解得 
$$
\begin{aligned}
F_2(x) &= e^{x-2}(\frac{1}{2}(x-2)^2-e(x-1)+e^2) \\\ 
&= e^x-(x-1)e^{x-1}+\frac{1}{2}(x-2)^2e^{x-2}.
\end{aligned}
$$
类似地求出 $F(X)$ 在 $x\in[3,4]$ 的表达式为 
$$
F_3(x) = e^x-(x-1)e^{x-1}+\frac{1}{2}(x-2)^2e^{x-2} - \frac{1}{3!}(x-3)^3e^{x-3}.
$$
于是推测在区间 $[n,n+1]$ 内，$F(x)$ 的表达式为：
$$
F_n(x) = \sum_{k=0}^n\frac{(k-x)^k}{k!}e^{x-k}, x\in[n,n+1], n\in\mathbb{Z}
$$
每往后挪一个区间到 $[n,n+1]$，$F(x)$ 的表达式就要多一个修正项 $\dfrac{(n-x)^n}{n!}e^{x-n}$。
由归纳法可以验证：$ F_n'(x) = F_n(x) - F_{n-1}(x-1) $，并且多出来的修正项在 $x=n$ 处值为 $0$，所以两个区间的交界处函数值是连续的，即 $F_n(n) = F_{n-1}(n)$。

$F(2) \approx 4.67, F(3) \approx 6.6666, F(4) \approx 8.6666$，虽然表达式里有指数函数，但函数图像接近于线性增长。

## 验证
<div>

负重上限：
<select id="limit">
<option value="1"> 1 </option>
<option value="2"> 2 </option>
<option value="3"> 3 </option>
<option value="4"> 4 </option>
<option value="16"> 16 </option>
<option value="256"> 256 </option>
</select>

实验次数：
<select id="times">
<option value="100"> 100 </option>
<option value="1000" selected> 1000 </option>
<option value="10000"> 10000 </option>
</select>

稻草根数：
<span id="count" >  </span>

稻草重量：
<span id="weight" >  </span>

最后一根稻草重量：
<span id="last_weight" >  </span>


<script>

function run_once(limit) {
    var total = 0.0;
    var last = 0.0;
    var count = 0;
    while (total < limit) {
        last = Math.random();
        total += last;
        count += 1;
    }
    return {'total': total, 'count': count, 'last': last};
}

function run() {
    var times = document.getElementById("times").value;
    var limit = document.getElementById("limit").value;
    var res_list = [];
    for (var i = 0; i < times; i++) {
        var res = run_once(limit);
        res_list[i] = res;
    }
    var sum_count = 0;
    var sum_total_weight = 0;
    var sum_last_weight = 0;
    for (var i = 0; i < res_list.length; i++) {
        sum_count += res_list[i].count;
        sum_total_weight += res_list[i].total;
        sum_last_weight += res_list[i].last;
    }

    document.getElementById("count").innerHTML = (sum_count/times).toFixed(2);
    document.getElementById("weight").innerHTML = (sum_total_weight/times).toFixed(2);
    document.getElementById("last_weight").innerHTML = (sum_last_weight/times).toFixed(2);
}
</script>

<input type="button" value="Run" onclick="run()">  </input>

</div>





