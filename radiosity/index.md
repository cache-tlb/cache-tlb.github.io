# Radiosity 辐射度方法


谈及全局光照，绕不开一个重要的方程，即渲染方程（Render Equation），如下是其中一个简化版本：
$$
L_o(x, \omega_o) = L_e(x, \omega_o) + \int_\Omega f_r(x,\omega_i\to\omega_o) L_i(x,\omega_i) (\omega_i\cdot n) \ \mathrm{d}\omega_i
$$


$L_o$ 表示沿 $\omega_o$ 方向离开点 $x$ 的辐射度，决定了相机看到 $x$ 点的亮度；
$\Omega$ 是 $x$ 点法线所在的半球范围；
$L_e$ 是自发光项；
$f_r$ 为 BRDF，由材质决定；
$L_i$ 表示沿 $\omega_i$ 方向照射到 $x$ 点的辐射度。 它也等于其他某个点 $x'$ 的 $L_o$ 项。
整个公示的含义就是，从物体表面一点来的光线等于物体自己产生的光线加上接收的其他表面来的光线再反射出去的那部分。

目标就是要求出 $L_o$ 项，Radiosity 的思路是将场景离散化为一些小片（patch），每个片上的辐射度恒定，并且限定所有物体表面都是漫反射的，因此不同方向的反射都是相同的。

设每个小片的辐射度为 $B_i$, 自发光项为 $E_i$，因为只考虑漫反射，BRDF 退化成一个常数值 $R_i$，也就是小片的反射率，剩下的其他项描述两个小片之间的辐射度传递关系，被称为 form factor，记为 $F_{ij}$。将渲染方程写成离散化的形式：
$$B_i = E_i + R_i \sum_j F_{ij} B_j .\tag{*}$$
等式两边除了 $B_i, B_j$ 以外，其他都是已知项，因此很容易想到写成矩阵的形式求解。

但实际上不用这么复杂，想象光线的传播过程，先是从光源出发，到达相机，此时只有自发光表面的 $B_i$ 才有值，其他的都是零. 这些非零的项代入到右边的求和式中，又会产生更多的非零项，也就是被直接光照亮的那些表面。再把当前的 $B_i$ 向量作为已知数代入 $(*)$ 式，则是相当于又计算了光线在物体表面反弹一次的间接光照。迭代几轮便会收敛到稳定值。
 

以下是一个简单[demo](./demo.html)。

<iframe id="frame" width="100%" height="300" src="./demo.html" style="border: none;"></iframe>
<script>
    const frame = document.getElementById('frame');
    const contentDom = document.getElementById('content');
    frame.height = window.innerHeight*0.75;
</script>



