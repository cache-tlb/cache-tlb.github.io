# 全景图渲染的常见问题


全景图是用2D平面图像表示球面图像的一种形式，例如世界地图。渲染全景图只需要准备一个球体模型，算好顶点UV，将2D图像作为纹理贴在球体表面即可。
原理很简单，实现起来会发现有不少陷阱。
本文记录了笔者遇到的一些细节问题及对应的解决办法。

### 国际日期变更线

如果使用默认的纹理参数，会发现球面上有一条断断续续的线贯穿南北两极，就像地球仪上的国际日期变更线一样。这并不是因为全景图左右边界没接上。事实上，这条线处在 $u=0$ 和 $u=1$ 的交界处。这条线附近的像素，$u$ 坐标会发生跳变。在采样纹理时，硬件认为纹理坐标梯度很大，应该用较大的mip level。正确的做法是检查 $u$ 的梯度，如果太大就将 $u=1$ 附近的那些 $u$ 值拉到 $u=0$ 附近。
``` cpp
const threshold = 0.1;  // tune by hand
float fwx = fwidth(uv.x);
if (fwx > threshold) {
    if (uv.x >= 0.0) uv.x -= 1.0;
}
return texture(u_texture, uv);
```

这里的阈值不一定好调。另一个策略分别计算原始的梯度和平移了 $u$ 坐标之后的梯度，取较小的那种情况。
``` cpp
float fwx = fwidth(uv.x);
float old_u = uv.x;
if (uv.x >= 0.0) uv.x -= 1.0;
float fwx2 = fwidth(uv.x);
if (fwx < fwx2) uv.x = old_u;
return texture(u_texture, uv);
```

### 南北极

即使修复了因 $u$ 值突变产生的虚线，还会发现在南北极发生了严重的失真。具体表现是围绕极点有多个环形的纹样，且极点附近的像素比其他位置更加模糊。这是因为极点附近 $u$ 坐标的梯度比其他地方更大，而 $v$ 坐标的梯度几乎是恒定的。因此采样纹理时也会用到较高等级的mip。这种情况下，$v$ 方向被错误地模糊了。修复措施是开启纹理的各向异性采样。

还要注意的是纹理的 wrap mode，一般会设为 repeat，对于 $u$ 方向来说确是如此。
考虑 $v$ 方向，全景图最上和最下一行的像素对应的球面位置并不在极点，而是靠近极点的一个圈。
在极点处的 $v$ 坐标会超出图像边界，wrap mode 产生作用。
正确的模式应该是 `wrap_T=clamp`.

### mipmap

如果不开mipmap，那么上述问题都不存在，唯一的问题就是欠采样，表现是在相机移动时画面会产生闪烁，以及细小的结构会被破坏，例如直线断开成虚线，等等。

### demo

在下面的[demo](./demo.html)中，可以看到修正 $u$ 值对于国际日期变更线问题的改善（`look at u=0 / u=1`，`fix u`），使用正确的wrap mode对于极点失真的改善（`look at top / bottom`，`fix wrap T` & `use anisotrpic`）。visualization mode 可以选择查看 $u$ 的梯度，各处的纹理各向异性程度。也可以用本地的全景图测试效果。

<iframe id="frame" width="100%" height="300" src="./demo.html" style="border: none;"></iframe>
<script>
    const frame = document.getElementById('frame');
    const contentDom = document.getElementById('content');
    frame.height = window.innerHeight*0.75;
</script>



