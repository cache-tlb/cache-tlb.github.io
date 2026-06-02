# 反直觉的概率问题

{{<  admonition  type="quote" title="Problem" open=true >}}

现有一个理想的经典6面骰子。 假设今天运气很奇怪，投掷出现的结果全是奇数点(只出现了1,3,5)。
问：投出 1 点的平均等待次数是多少(算上成功投出1的那一次)？
{{<  /admonition  >}}


如果一个随机数生成器，等概率地蹦出 1, 3, 5, 则每个数字的平均等待时间显然是 3 次。真的如此吗？先模拟一下：

<div>
<table>
<tr>
<td>模拟次数：</td>
<td>
<select id="times">
<option value="1000"> 1000 </option>
<option value="10000" selected> 10000 </option>
<option value="100000"> 100000 </option>
</select>
</td>
</tr>
<tr>
<td>有效投掷次数：</td>
<td> <span id="valid_count" > NaN  </span> </td>
</tr>
<tr>
<td> 投出1的等待次数：</td> 
<td> <span id="wait_time" > NaN </span> </td> 
<tr> <td> <input type="button" value="Run" onclick="run()">  </input> </td> </tr>
</table>

<script>
function run_once() {
    var count = 0;
    while (true) {
        var v = Math.random();
        var i = Math.floor(v*6+1);
        if (i < 1 || i > 6) continue;
        count++;
        if (i%2 == 0) {
            count = 0;
            break;
        } else if (i == 1) {
            break;
        } 
    }
    return count;
}

function run() {
    var times = document.getElementById("times").value;
    var valid_count = 0;
    var sum_wait_time = 0;
    for (var i = 0; i < times; i++) {
        var res = run_once();
        if (res > 0) {
            valid_count++;
            sum_wait_time += res;
        }
    }

    document.getElementById("valid_count").innerHTML = valid_count;
    document.getElementById("wait_time").innerHTML = (sum_wait_time/valid_count).toFixed(2);
}

run();
</script>

</div>

模拟的结论是平均等待次数为 1.5 而不是 3。下面分析原因。

{{<  admonition  type="tip" title="Answer" open=false >}}

定义投掷一轮骰子为连续投掷直到出现 1, 或出现了2/4/6. 假设投掷了 $N$ 轮骰子, $N\to\infty$, 将结束在 2/4/6 的那些轮排除在外, 统计剩余这些轮里面的平均投掷次数.

某一轮中第 $k$ 次出现了 2/4/6, 需要满足前 $k-1$ 次只投出 3,5, 且第 $k$ 次投出 2/4/6. 概率为 $\dfrac{1}{3^{k-1}}\cdot\dfrac{1}{2}$. 排除掉的轮数占比为 
$$\sum_{k=1}^{\infty}\dfrac{1}{3^{k-1}}\cdot\dfrac{1}{2} = \frac{3}{4} .$$
故不含 2/4/6 的投掷共有 $\dfrac{N}{4}$ 轮.

全部 $N$ 轮投掷中, 投掷了 $k$ 次并最终投出了 1 点的占比为: $\dfrac{1}{3^{k-1}}\cdot\dfrac{1}{6}$, 换算成在不含 2/4/6 的那些轮的比例需要再除以 $\dfrac{1}{4}$. 所以所求期望为
$$ E = \sum_{k=1}^\infty \dfrac{1}{3^{k-1}}\cdot\dfrac{1}{6}\cdot k \cdot 4 = .\frac{3}{2} .$$

{{< /admonition >}}

