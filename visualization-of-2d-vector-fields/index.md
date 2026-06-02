# 二维向量场的可视化


在图形渲染领域经常需要处理 2D 向量场，例如有些游戏会用 2D 流体模拟营造出 3D 流体效果，例如 [fluid ninja](https://www.fab.com/listings/90266972-0597-4404-a54a-8c0b7e00a005)。为了 debug 速度场，就需要合适的 2D 向量场的可视化方法。
为了图省事，可以直接将向量的 xy 分量分别作为 RG 通道显示出来，缺点是不够直观。

想要直观，最好的办法是用箭头标记每位置的方向。为此可以准备一个箭头的sprite，用instance方式渲染，instance buffer里填上变换矩阵。每个instance位置是固定的，旋转和缩放由向量场的实际数值决定。
是否需要将算出的向量场的值从 GPU 纹理或者 buffer 读到 CPU 再传给 instance buffer 呢？
其实也不必，可以在 vertex shader 里读到存储向量场的纹理或 buffer，换算出变换矩阵即可。

还有更简单的做法，用一步全屏后处理就可以做到。首先将屏幕分成固定大小的方格，例如32x32，方格内的每个像素都读取方格中心的向量值，然后根据自己与方格中心的相对位置，判断自己是不是在箭头上，并可以换算该像素在箭头sprite图的 uv。
下面是一个简单的[示例](./demo.html)，主体是经典的 stable fluids 流体模拟，叠加了流体速度的可视化。
在 canvas 上按下鼠标拖动可以画上颜料并赋予流体速度。

<iframe id="frame" width="100%" height="300" src="./demo.html" style="border: none;"></iframe>
<script>
    const frame = document.getElementById('frame');
    const contentDom = document.getElementById('content');
    frame.height = window.innerHeight*0.75;
</script>


