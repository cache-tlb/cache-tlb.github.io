# 重要性采样


## 蒙特卡罗积分

假设随机变量 $x$ 的概率密度函数为 $p(x)$，则以 $x$ 为自变量的函数 $g(x)$ 的期望值为 
$$E[g(x)]=\int_{a}^{b}{g(x)p(x){\rm d}x} .$$
如果要计算一个函数 $f(x)$ 的积分值 $\displaystyle I=\int_{a}^{b}{f(x){\rm d}x}$，只要令 $g(x)=\dfrac{f(x)}{p(x)}$，则 $g(x)$ 就是对 $I$ 的一个无偏估计，或者说，$g(x)$ 的期望等于 $I$。

用单个样本代表整个定义域上的积分值不是很好的主意，一般我们会采样一组独立同分布的样本 $\\{x_i\\}$，概率密度都是 $p(x)$，样本数量为 $N$，则 $g(x_i)$ 的平均值的期望为：
$$E\\left[\frac{1}{N}\sum_{i=1}^{N}{g(x_i)}\\right]=\frac{1}{N}\sum_{i=1}^{N}{E\\left[g(x_i)\\right]}=\frac{1}{N}\sum_{i=1}^{N}{\int_{a}^{b}{\frac{f(x)}{p(x)}\cdot p(x){\rm d}x}} = I .$$

可见 $g(x_i)$ 的平均值也是积分值 $I$ 的无偏估计。

<br/>

## 重要性采样

再考虑估计的方差。注意到 $i\ne j$时，$x_i$ 与 $x_j$ 独立，$g(x_i)$ 与 $g(x_j)$ 也独立，协方差为 0，$E[g(x_i)g(x_j)]=E[g(x_i)]\cdot E[g(x_j)]=E[g(x)]^2$，

$$
\begin{aligned} 
Var\\left[\frac{1}{N}\sum_{i=1}^{N}{g(x_i)}\\right] &= E\\left[\\left(\frac{1}{N}\sum_{i=1}^{N}{g(x_i)}\\right)^2\\right] - \\left(E\\left[\frac{1}{N}\sum_{i=1}^{N}{g(x_i)}\\right]\\right)^2\\\ 
&= \frac{1}{N}\cdot E\\left[g(x)^2\\right] + \frac{1}{N^2}\cdot E\\left[\sum_{i\ne j}{g(x_i)g(x_j)}\\right]-E[g(x)]^2 \\\ 
&= \frac{1}{N}\cdot E\\left[g(x)^2\\right] - \frac{1}{N}\cdot I^2
\end{aligned}
$$
注意到 $I$ 是积分的真实值，是一个常数，于是方差大小取决于样本数 $N$ 以及 $g(x)^2$ 的期望。样本数越大则方差越小，是符合直觉的。什么样的 $g(x)$，或者说如何选取 $p(x)$，能让方差最小呢？

继续研究 $g(x)^2$ 的期望，根据定义有如下的推导：
$$
\begin{aligned} 
E[g(x)^2] &= \int_{a}^{b}{\frac{f(x)^2}{p(x)^2}\cdot p(x){\rm d}x} \\\ 
&=  \\left(\int_{a}^{b}{\frac{f(x)^2}{p(x)^2}\cdot p(x){\rm d}x}\\right)\cdot\\left(\int_{a}^{b}{p(x){\rm d}x}\\right)\\\ 
& \ge \\left(\int_{a}^{b}{\sqrt{\frac{f(x)^2}{p(x)^2}\cdot p(x)}\cdot\sqrt{p(x)}{\rm d}x}\\right)^2 \\\ 
&= I^2.
\end{aligned} 
$$
第二行利用了概率密度的性质 $\displaystyle \int_{a}^{b}{p(x){\rm d}x} = 1$，第三行利用了 Cauchy-Schwarz 不等式。等号成立的条件是 $\dfrac{f(x)^2}{p(x)}$ 与 $p(x)$ 线性相关，即 $f(x)=k\cdot p(x)$ 恒成立。又因为 $p(x)$ 是概率密度，两边在定义域上积分可以求出 
$$k = k\int_{a}^{b}{p(x){\rm d}x} = \int_{a}^{b}{f(x){\rm d}x} = I .$$
换言之，只要取 $p(x)={f(x)}/{I}$，就能使方差达到最小值 $0$。
事实上，这个时候任取 $x$，都有 $g(x)={f(x)}/{p(x)}=I$，不管采样点在哪里，$g(x)$ 都是恒定的，所以方差是 $0$。

然而，这里的 $I$ 就是我们要求的积分值，是未知的。我们只能根据已知的信息，让采样点的分布 $p(x)$ 尽量正比于待求积分的被积函数 $f(x)$。这便是重要性采样的含义。

被积函数 $f(x)$ 的值对不同的 $x$ 函数值有大有小，大的函数值对最终的积分结果贡献更大，因此我们希望在影响更大的 $x$ 处采集更多样本，以提高精度，这也是重要性采样的直观理解。

从另一个角度说，我们希望贡献大的区域的误差尽量小。例如，被积函数的某一个区间A的积分真实值是0.1，另一个区间B积分的真实值是 100。区间A上 5% 的误差对于结果的影响相比于区间B上 5%的误差来说是微不足道的。只要采样点的分布和被积函数的图像大致匹配，就能达到上述目标。这就是importance sampling的朴素思想。

需要注意的是，概率密度是非负的，而概率密度正比于函数值，所以重要性采样只适用于非负函数的积分估计。

<br/>

## 例子

<div>

被积函数：
<select id="integrator">
<option value="constant"> y=1 </option>
<option value="linear"> y=x </option>
<option value="sqr"> y=x^2 </option>
<option value="negative"> y=1-x </option>
</select>

PDF：
<select id="pdf">
<option value="constant"> y=1 </option>
<option value="linear"> y=2*x </option>
<option value="sqr"> y=3*x^2 </option>
<option value="negative"> y=2*(1-x) </option>
</select>

每次实验采样个数：
<select id="samples">
<option value="10"> 10 </option>
<option value="100" selected > 100 </option>
<option value="1000"> 1000 </option>
</select>

实验次数：
<select id="times">
<option value="10"> 10 </option>
<option value="100" selected> 100 </option>
<option value="1000"> 1000 </option>
</select>

平均值：
<span id="mean" >  </span>

方差：
<span id="variance" >  </span>


<script>

function generate_list_by_pdf(inv_cdf, sample_num) {
    var ret = [];
    ret.length = sample_num;
    for (var i = 0; i < sample_num; i++) {
        var rand = Math.random();
        ret[i] = inv_cdf(rand);
    }
    return ret;
}

function run_once(f, pdf, inv_cdf, sample_num) {
    var xs = generate_list_by_pdf(inv_cdf, sample_num);
    var sum = 0.0;
    for (var i = 0; i < xs.length; i++) {
        sum += f(xs[i]) / pdf(xs[i]);
    }
    return {"avg": sum / xs.length, "samples": xs};
}

function constant(x) { return 1; }
function linear(x) { return x; }
function sqr(x) { return x*x; }
function negative(x) { return 1-x; }

var f_list = {
    "constant": constant,
    "linear": linear,
    "sqr": sqr,
    "negative": negative
}

function linear_pdf(x) { return 2*x; }
function sqr_pdf(x) { return 3*x*x; }
function negative_pdf(x) { return 2*(1-x); }

var pdf_list = {
    "constant": constant,
    "linear": linear_pdf,
    "sqr": sqr_pdf,
    "negative": negative_pdf
}

function constant_inv_cdf(x) { return x; }
function linear_inv_cdf(x) { return Math.sqrt(x); }
function sqr_inv_cdf(x) { return Math.pow(x, 1./3.); }
function negative_inv_cdf(x) { return 1-Math.sqrt(1-x); }

var inv_cdf_list = {
    "constant": constant_inv_cdf,
    "linear": linear_inv_cdf,
    "sqr": sqr_inv_cdf,
    "negative": negative_inv_cdf
}

function run() {
    var integrator_name = document.getElementById("integrator").value;
    var pdf_name = document.getElementById("pdf").value;
    var times = document.getElementById("times").value;
    var samples = document.getElementById("samples").value;
    var f = f_list[integrator_name];
    var pdf = pdf_list[pdf_name];
    var inv_cdf = inv_cdf_list[pdf_name];
    var res_list = [];
    for (var i = 0; i < times; i++) {
        var res = run_once(f, pdf, inv_cdf, samples);
        res_list[i] = res['avg'];
    }
    var sum = 0;
    for (var i = 0; i < res_list.length; i++) {
        sum += res_list[i];
    }
    var avg = sum / res_list.length;
    sum = 0;
    for (var i = 0; i < res_list.length; i++) {
        var d = res_list[i] - avg;
        d = d*d;
        sum += d;
    }
    var variance = sum / res_list.length;

    document.getElementById("mean").innerHTML = avg;
    document.getElementById("variance").innerHTML = variance;
}
</script>

<input type="button" value="Run" onclick="run()">  </input>

</div>

上面的简单例子中，积分区间都是 $[0,1]$，被积函数可以选择 $y=1, y=x, y=x^2, y=1-x$ 这几种，PDF的形状也可以在这几个函数中选择，并且要乘以归一化系数。
每次实验我们生成若干个样本进行蒙特卡罗积分，得到一个估计值。
点击Run按钮会重复多次实验，得到估计值的均值和方差。

可以得到如下几个结论：
- 当被积函数和 PDF 形状一样的时候，总是能得到完全正确的估计值，且方差是0
- 被积函数取 $y=x^2$，PDF 分别选 $y=2x$ 和 $y=2(1-x)$，因为前者更匹配被积函数的形状，所以方差比后者要小几个数量级
- 增加蒙特卡罗积分的样本数也能减小方差

