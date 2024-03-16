# Morton Code


## Morton Code 编码算法

笔者在探索 UE4 源码时，发现一段有趣的代码，如下：
``` cpp
uint MortonCode2(uint x)
{
    x &= 0x0000ffff;
    x = (x ^ (x << 8)) & 0x00ff00ff;  // 0b0000000011111111
    x = (x ^ (x << 4)) & 0x0f0f0f0f;  // 0b0000111100001111
    x = (x ^ (x << 2)) & 0x33333333;  // 0b0011001100110011
    x = (x ^ (x << 1)) & 0x55555555;  // 0b0101010101010101
    return x;
}

uint MortonEncode(uint2 Pixel)
{
    uint Morton = MortonCode2(Pixel.x) | (MortonCode2(Pixel.y) << 1);
    return Morton;
}
```

它的作用就是将一个图像中的二维像素坐标编码为一个整数。一般而言，二维图像在内存中也是用线性数组存储，通常的做法是将像素数据一整行一整行的接续排列，所以坐标为 $(x,y)$ 的像素排在线性数组的位置为 $x + y\times W$，这里 $W$ 是一行的数据量，也就是图像的宽度。

Morton Code 提供了另一种像素位置到线性数组的排列顺序，如下图所示。

<div align="center">
<canvas id="main_canvas" width="100" height="100" style="border:1px solid"> </canvas>

<script>

var canvas = document.getElementById("main_canvas");
var content = document.getElementById("content");
var canvas_size = 1;
var point_num_per_row = 16;
var point_spacing = 1;
function resize() {
    var w = content.clientWidth;
    var h = content.clientHeight;
    canvas_size = Math.min(w,h) / 1.3;
    canvas.width = canvas_size;
    canvas.height = canvas_size;
    point_spacing = canvas_size / point_num_per_row;
}
function MortonCode2(x)
{
    x &= 0x0000ffff;
    x = (x ^ (x << 8)) & 0x00ff00ff;
    x = (x ^ (x << 4)) & 0x0f0f0f0f;
    x = (x ^ (x << 2)) & 0x33333333;
    x = (x ^ (x << 1)) & 0x55555555;
    return x;
}
function MortonEncode(Pixel)
{
    var Morton = MortonCode2(Pixel[0]) | (MortonCode2(Pixel[1]) << 1);
    return Morton;
}
function ReverseMortonCode2(x)
{
	x &= 0x55555555;
	x = (x ^ (x >> 1)) & 0x33333333;
	x = (x ^ (x >> 2)) & 0x0f0f0f0f;
	x = (x ^ (x >> 4)) & 0x00ff00ff;
	x = (x ^ (x >> 8)) & 0x0000ffff;
	return x;
}
function MortonDecode(Morton)
{
	return [ReverseMortonCode2(Morton), ReverseMortonCode2(Morton >> 1)];
}
function run() {
    var points = [];    
    for (var y = 0; y < point_num_per_row; y++) {
        for (var x = 0; x < point_num_per_row; x++) {
            var pos = [x,y];
            var index = MortonEncode(pos);
            points[index] = [x+0.5,y+0.5];
        }
    }
    var ctx=canvas.getContext("2d");
    for (var i = 0; i < points.length - 1; i++) {
        ctx.moveTo(points[i][0] * point_spacing, points[i][1] * point_spacing);
        ctx.lineTo(points[i+1][0]*point_spacing,points[i+1][1]*point_spacing);
        ctx.lineWidth=1;
        ctx.strokeStyle="red";        
        ctx.stroke();
    }
}
resize();
var frame_index = 0;
function reset() {
    frame_index = 0;
    var ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);    
}
function zoom_in() {
    if (point_num_per_row > 2) {
        point_num_per_row /= 2;
        point_spacing = canvas_size / point_num_per_row;
        reset();
    }
}
function zoom_out() {
    if (point_num_per_row < 64) {
        point_num_per_row *= 2;
        point_spacing = canvas_size / point_num_per_row;
        reset();
    }
}
function render() {
    if (frame_index + 1 < point_num_per_row*point_num_per_row) {
        var pos1 = MortonDecode(frame_index);
        var pos2 = MortonDecode(frame_index + 1);
        var ctx=canvas.getContext("2d");
        var point_offset = point_spacing / 2;
        ctx.beginPath();
        ctx.moveTo(pos1[0] * point_spacing + point_offset, pos1[1] * point_spacing + point_offset);
        ctx.lineTo(pos2[0] * point_spacing + point_offset, pos2[1] * point_spacing + point_offset);
        ctx.lineWidth=1;
        ctx.stroke();
        frame_index++;
    }
    window.requestAnimationFrame(render);
}
window.requestAnimationFrame(render);
</script>
<br/>
<input type="button" value="Reset" onclick="reset()">  </input>
<input type="button" value="ZoomIn" onclick="zoom_in()">  </input>
<input type="button" value="ZoomOut" onclick="zoom_out()">  </input>
</div>

可见在 Morton Code 的编码方式下，相邻的四个像素按 z 字形排列，相邻的四个 z 字形小块又按 z 字形排列成更大的块，如此递归下去。这种编码方式可以使空间位置相近的像素在线性数组也尽量排列在相近的位置。另一个不太重要的好处是像素位置与 Morton Code 的对应关系是固定的，不随图像宽度改变，但使用 Morton Code 的前提是要满足图像宽度为 2 的整数次幂。

从代码中可以看出，Morton Code将两个整数 $(x,y)$ 变成一个整数 $z$ 的方式是令 $z$ 的二进制的偶数位填上 $x$ 的二进制串，奇数位填上 $y$ 的二进制串，因此解码的算法也比较简单。

``` cpp
uint ReverseMortonCode2(uint x)
{
    x &= 0x55555555;
    x = (x ^ (x >> 1)) & 0x33333333;
    x = (x ^ (x >> 2)) & 0x0f0f0f0f;
    x = (x ^ (x >> 4)) & 0x00ff00ff;
    x = (x ^ (x >> 8)) & 0x0000ffff;
    return x;
}

uint2 MortonDecode(uint Morton)
{
    uint2 Pixel = uint2(ReverseMortonCode2(Morton), ReverseMortonCode2(Morton >> 1));
    return Pixel;
}
```

## 比较

GPU的cache line通常较小，例如 128 bytes，相当于 32 个 RGBA8 格式像素。
采样纹理时通常会使用双线性插值的方式滤波，这需要访问采样点附近的 2x2 像素块。
如果显存中纹理用行主序的方式排列像素，当纹理宽度都超过32时，则访问 2x2 的像素块至少需要两个cache line。
而如果用 Marton Code 的方式排列像素，直观上来看多数情况下一个 cache line 内就能涵盖 2x2 块的每个像素，而有些情况下 4 个像素分别需要一个 cache line。

虽然双线性插值的 4 个像素需要占用几个 cache line 与纹理采样的效率并没有简单而直接的对应关系，但我们可以用它衡量两种像素排列方式的是否具有好的局部性。下表统计了不同大小的正方形纹理平均需要多少个 cache line 才能完成一次双线性插值，wrap mode 为 clamp to edge。
|  cache line  |  1  |  2 |  3 |  4 | avg. |
|  ----  | ----  | ---- | ---- | ---- | ---- |
| 128x128 Linear | 0.8% | 96.9% | 0 | 2.3% | 2.039 |
| 128x128 Morton Code | 66.9%  | 30.3% | 0 | 2.8% | 1.388 |
| 256x256 Linear | 0.4% | 96.9% | 0 | 2.7% | 2.051 |
| 256x256 Morton Code | 66.3% | 30.8% | 0 | 3.0% | 1.397 |
| 512x512 Linear | 0.2% | 96.9% | 0 | 2.9% | 2.057 |
| 512x512 Morton Code | 65.9% | 31.0% | 0 | 3.1% | 1.402 |

表中的百分比表示多大比例的像素需要 1，2，3，4个 cache line 来完成双线性插值。最后一列表示随机取一个纹理坐标做双线性插值所需的cache line的期望个数。平均而言，Morton Code比线性排列要节省 30% 的 cache 刷新次数。

