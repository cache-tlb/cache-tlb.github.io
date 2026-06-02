# 全景图的多视角拼接


借助 UE5 进行虚拟拍摄已经越来越普及，UE官方提供的 MovieRenderQueue 插件可以满足大部分拍摄需求。然而对于全景图的拍摄需要进行额外的处理，因为全景图无法仅通过渲染一个视角得到，而是要对多个视角的图像进行拼接。
UE5的一些高级效果严重依赖屏幕空间信息，例如 lumen，同一个机位下的同一个物体在不同视角下的亮度可能存在差异，这会导致拼接的时候产生不连续的接缝。笔者在开发中尝试了一些简单且有效的融合策略，在此记录。

假设我们要合成全景图上一点 $p$ 的颜色，其球面经纬度为 $(\phi,\theta)$。其中一个视角的图像对应的相机（yaw, pitch）为 $(\phi_v, \theta_v)$，相机fov为 $\alpha$，我们希望知道 $p$ 点在这张图像的 uv 坐标，以便采样。经过几何关系可推导出如下关系。
$$
\begin{aligned}
\Delta\phi &= \phi-\phi_v \\\ 
x &= \tan(\Delta \phi) \cdot (\cos\theta_v - y \cdot \sin\theta_v) \\\ 
y &=  \frac{\tan\theta - \tan\theta\_v\cdot\cos(\Delta \phi)}{\cos(\Delta\phi) + \tan\theta\_v\cdot\tan\theta} \\\ 
z &= \tan(\alpha/2) \\\ 
u &= x / z \\\ 
v &= y / z
\end{aligned}
$$

可能存在多个视角的图像能看到这个点，以谁为准呢？比较合理的思路是将所有视图看到的颜色进行加权平均，权重分布满足如下条件：
- 越靠近图像中心越大，越靠近图像边缘权重越小
- 超出图像范围权重衰减至0
- 权重在空间的变化要连续

根据上述要求可以设计几个权重函数($-1\le x \le 1$)：
- 常数：$f(x) = 1$
- 线性：$f(x) = 1 - |x|$
- 多项式：平方，三次方等，$f(x) = (1 - |x|)^n$
- 根式：平方根，立方根等，$f(x) = \sqrt[n]{(1 - |x|)}$
- 余弦：$f(x) = \cos(|x|\cdot\pi/2)$

从下面的[demo](./demo.html)可以看出，线性的相对权重已经够用了。
<iframe id="frame" width="100%" height="300" src="./demo.html" style="border: none;"></iframe>
<script>
    const frame = document.getElementById('frame');
    const contentDom = document.getElementById('content');
    frame.height = window.innerHeight*0.75;
</script>

