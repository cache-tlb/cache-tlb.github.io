# 反直觉的概率问题-之二


一个普通的指针式时钟，上有一只虫子初始在 12 点，虫子每一步会顺时针或逆时针移动到相邻的数字上，每一步的运动方向随机且相互独立。当虫子刚好到达过所有的数字时结束。问结束时虫子停在 6 点的概率。

先模拟一下：
<input type="button" value="Run" onclick="run(12,100000)">  </input>
<script>
function run_once(N) {
    var rounds = 0;
    var last_node = -1;
    var visited = new Array(N).fill(false);
    visited[0] = true;
    var current_node = 0;
    var total_visited = 1;
    while (true) {
        rounds++;
        var direction = Math.random() < 0.5 ? -1 : 1;
        current_node = (current_node + direction + N) % N;
        if (!visited[current_node]) {
            visited[current_node] = true;
            total_visited++;
        }
        if (total_visited == N) {
            last_node = current_node;
            break;
        }
    }
    return {rounds: rounds, last_node: last_node};
}

function run(nodes, trials) {
    var total_rounds = 0;
    var last_node_counts = new Array(nodes).fill(0);
    for (var i = 0; i < trials; i++) {
        var result = run_once(nodes);
        total_rounds += result.rounds;
        last_node_counts[result.last_node]++;
    }
    // console.log("Average rounds: " + (total_rounds / trials));
    // console.log("Last node distribution: " + last_node_counts.map(count => count / trials).join(", "));
    const tableBody = document.querySelector("#myTable tbody");
    tableBody.innerHTML = last_node_counts.map((item,index) => `<tr><td>${index==0?12:index}</td><td>${item/trials}</td></tr>`).join('');
}
</script>
<table id="myTable" border="1">
  <thead>
    <tr><th> stop at</th><th>frequency</th></tr>
  </thead>
  <tbody>
    <!-- Rows will be injected here -->
    <tr><td>12</td><td>0</td></tr>
  </tbody>
</table>
可见在每个点结束的概率竟然是一样的，为什么呢？

{{<  admonition  type="tip" title="Answer" open=false >}}

考虑更一般的情况。假设虫子经过 $N$ 步结束在 $k$ 点($k\neq 12$)，虫子要先经过它的左右两个邻居。假设先在 $t$ 时刻到达了左边邻居，然后转身绕一圈到达另一个邻居。这说明虫子在 $t$ 时刻之前达到过哪些点都无关紧要，因为之后又要路过一遍。
换言之， 只要是以 $k$ 点结束，无论虫子初始在什么位置，情况都是一样的。根据对称性，给定起始点，无论结束在哪个点，情况也是等价的。意味着结束于每个点的概率都相同，为 $\dfrac{1}{11}$。

<strong> </strong>

{{< /admonition >}}

---

多问一句，从开始到结束时期望走了多少步？

{{<  admonition  type="tip" title="Answer" open=false >}}

虫子达到过的数字在一段连续的圆弧上，由这个圆弧的长度（包含数字的个数）$L$ 表示状态，初始 $L=1$，现在计算 $L=N$ 到达 $L=N+1$ 平均需要走多少步。刚到达 $L=N$ 状态时，虫子一定位于圆弧的两个端点之一。
记圆弧上的数字依次为 $v_1, \cdots, v_N$，虫子在 $v_k$ 时走出圆弧范围平均需要 $E_k$ 步，则有：
$$
\begin{align*}
E_1 &= \frac{1}{2}(1+E_2) \\\ 
E_2 &= \frac{1}{2}(E_1+E_3) \\\ 
\cdots & \\\ 
E_{N-1} &= \frac{1}{2}(E_{N-2}+E_N) \\\ 
E_N &= \frac{1}{2}(1+E_{N-1})
\end{align*}
$$
注意到（注意力惊人！）这个方程的解为 $E_k = k\cdot(N+1-k)$。所以状态从 $L=N$ 转到 $L=N+1$ 需要花费 $E_1=E_N = N$ 步。
因此整个过程到结束的期望步数为 $1+2+\cdots + 11 = 66$ 步。


{{< /admonition >}}

