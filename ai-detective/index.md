# AI 侦探


现在的 AI 推理能力已经是今非昔比，今天测试了一个命令行的推理谜题 clmystery，效果令人印象深刻。来源: 【[Github](https://github.com/veltman/clmystery)】, 【[本地备份](./clmystery-master.zip)】。题目如下：

{{<  admonition  type="quote" open=true >}}

There's been a murder in Terminal City, and TCPD needs your help.

To figure out whodunit, go to the 'mystery' subdirectory and start working from there.

You'll want to start by collecting all the clues at the crime scene (the 'crimescene' file).

The officers on the scene are pretty meticulous, so they've written down EVERYTHING in their officer reports.

Fortunately the sergeant went through and marked the real clues with the word "CLUE" in all caps.

If you get stuck, open one of the hint files (from the CL, type 'cat hint1', 'cat hint2', etc.).

To check your answer or find out the solution, open the file 'solution' (from the CL, type 'cat solution').

To get started on how to use the command line, open cheatsheet.md or cheatsheet.pdf (from the command line, you can type 'nano cheatsheet.md').

Don't use a text editor to view any files except these instructions, the cheatsheet, and hints.

{{<  /admonition >}}


直接在 OpenClaw 里让它按指引工作即可。提示词如下：
`
将工作目录切到 ~/clmystery，你是一个侦探，根据 ~/clmystery/instructions 的指引找到凶手，并写下完整的推理链条，例如 根据 instauctions 搜索文件 xxxx，得到结论/线索 yyyy；根据线索 yyyy 和 zzzz 搜索文件 aaaa，得到结论/线索 bbbb，等等
`

模型采用 DeepSeek-V4-Pro，消耗了约 500K 的token，就找到了答案。输出的推理过程如下：

{{<  admonition  type="quote" open=false >}}

📋 完整推理链条

### 线索一：犯罪现场调查 → 凶手画像

根据 instructions 指引，搜索 crimescene 中标记为 "CLUE" 的内容：

```bash
  grep -n "CLUE" ~/clmystery/mystery/crimescene
```

得出 3 条关键线索：

- 线索 1：ATM 监控显示凶手是身高 ≥ 6 英尺的高个子男性
- 线索 2：凶手钱包里有 AAA、Delta SkyMiles、图书馆、Museum of Bash History 四张会员卡
- 线索 3：枪响前离开咖啡店的女人叫 Annabel，金发短发，新西兰口音

────────────────────────────────────────────────────────────────────────────────

### 线索二：追踪目击证人 → 获取逃逸车辆信息

搜索 people 文件找 Annabel：

```bash
  grep -i "annabel" ~/clmystery/mystery/people
```

找到 4 个 Annabel（2 女 2 男）。走访两位女性 Annabel 的住所：

- Annabel Sun（Hart Place, line 40）：棕发，非新西兰人 ❌
- Annabel Church（Buckingham Place, line 179）：她的证词提供了逃逸车辆关键信息 —— 蓝色 Honda，车牌以 "L337" 开头、以 "9" 结尾

────────────────────────────────────────────────────────────────────────────────

### 线索三：车辆追踪 → 锁定嫌犯范围

搜索 vehicles 文件：

```bash
  grep -A5 "License Plate L337" ~/clmystery/mystery/vehicles
```

找到 6 辆蓝色 Honda（L337...9），筛选身高 ≥ 6' 的男性：

┌─────────┬──────────────────┬──────┬───────────┐
│ 车牌    │ 车主             │ 身高 │ 性别      │
├─────────┼──────────────────┼──────┼───────────┤
│ L337QE9 │ Erika Owens      │ 6'5" │ 女 ❌     │
├─────────┼──────────────────┼──────┼───────────┤
│ L337539 │ Aron Pilhofer    │ 5'3" │ ❌ (太矮) │
├─────────┼──────────────────┼──────┼───────────┤
│ L337369 │ Heather Billings │ 5'2" │ ❌        │
├─────────┼──────────────────┼──────┼───────────┤
│ L337DV9 │ Joe Germuska     │ 6'2" │ 男 ✅     │
├─────────┼──────────────────┼──────┼───────────┤
│ L3375A9 │ Jeremy Bowers    │ 6'1" │ 男 ✅     │
├─────────┼──────────────────┼──────┼───────────┤
│ L337WR9 │ Jacqui Maher     │ 6'2" │ 女 ❌     │
└─────────┴──────────────────┴──────┴───────────┘

嫌犯缩小到 2 人：Joe Germuska 和 Jeremy Bowers

────────────────────────────────────────────────────────────────────────────────

### 线索四：会员卡交叉比对 → 决定性证据

对比两人的四张会员卡：

┌────────────────────────┬──────────────┬───────────────┐
│ 会员卡                 │ Joe Germuska │ Jeremy Bowers │
├────────────────────────┼──────────────┼───────────────┤
│ AAA                    │ ✅           │ ✅            │
├────────────────────────┼──────────────┼───────────────┤
│ Delta SkyMiles         │ ❌           │ ✅            │
├────────────────────────┼──────────────┼───────────────┤
│ Terminal City Library  │ ✅           │ ✅            │
├────────────────────────┼──────────────┼───────────────┤
│ Museum of Bash History │ ❌           │ ✅            │
└────────────────────────┴──────────────┴───────────────┘

Joe Germuska 缺少 Delta SkyMiles 和 Museum of Bash History ❌
Jeremy Bowers 拥有全部四张会员卡 ✅✅✅✅

────────────────────────────────────────────────────────────────────────────────

### 线索五：走访嫌犯住所 → 最终确认

```bash
  sed -n '284p' ~/clmystery/mystery/streets/Dunstable_Road
  # → SEE INTERVIEW #9620713
```

证词显示：「家中空无一人，邻居称住户近期外出旅行」—— 畏罪潜逃！

────────────────────────────────────────────────────────────────────────────────

### 🎯 结论

┌────────────────────────┬───────────────┐
│ 条件                   │ Jeremy Bowers │
├────────────────────────┼───────────────┤
│ 身高 ≥ 6'              │ ✅ 6'1"       │
├────────────────────────┼───────────────┤
│ 男性                   │ ✅            │
├────────────────────────┼───────────────┤
│ 蓝色 Honda             │ ✅            │
├────────────────────────┼───────────────┤
│ 车牌 L337...9          │ ✅ L3375A9    │
├────────────────────────┼───────────────┤
│ AAA 会员               │ ✅            │
├────────────────────────┼───────────────┤
│ Delta SkyMiles         │ ✅            │
├────────────────────────┼───────────────┤
│ 图书馆会员             │ ✅            │
├────────────────────────┼───────────────┤
│ Museum of Bash History │ ✅            │
├────────────────────────┼───────────────┤
│ 住所空无一人           │ ✅ 潜逃       │
└────────────────────────┴───────────────┘

凶手身份已通过 MD5 校验确认：Jeremy Bowers！ 🕵

{{<  /admonition  >}}

