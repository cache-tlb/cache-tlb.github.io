# [游戏评论] Hocus


偶然发现一个小游戏，叫 [Hocus](https://store.steampowered.com/app/418040/hocus/)，中文翻译叫“迷惑”或“错觉”。
是一个利用视错觉的解谜类游戏。不禁让人联想到“纪念碑谷”。可谓是一提到视错觉游戏，必绕不过“纪念碑谷”。然而这个游戏更像“无限回廊”（Echochrome）一点。

言归正传，这个游戏的机制是控制红色方块在平台上移动，只能在表面平动，不能翻过棱边，要始终保证方块至少有一个面与平台接触。
目标是要让它到达红色的格子上。
平台看上去是三维模型，但构造上属于局部合理而整体上矛盾的结构。这也正式此类视错觉的精髓所在。抓住这一点设计出来的游戏总让人眼前一亮。

略遗憾的是，Hocus 也就止步于此。游戏共有 100 个关卡，难度总体是递增的，后面几十关难度都差不多，再也没有其他变化。
解谜也没啥好说的，本质上就是一个走迷宫的游戏，用深度优先搜索即可。
如果一次全部通关难免会感到厌倦。大概这只是作者练手的作品吧。

Hocus 还有一个续作 [Hocus 2](https://store.steampowered.com/app/1460610/hocus_2/)，比起前作更有一点游戏的样子。同样有 100 个左右的关卡，机制更丰富。除了视错觉这个核心要素和到达红色格子的目标不变以外，有些关卡增加了阻碍，比如平台的某些格子在走过一次之后会消失，而不能往回走；有些关卡需要躲避随机游走的敌人；有些需要抓住到处乱跑的小球；还有一些关可以控制平台变化成不同的构造。

两作难度上差不多，甚至续作可能更简单一点。每关花费的时间在 1~5 分钟不等，比如下图就是典型的一关。想必聪明的你早已看出了走法 ^_^
<center>
{{< tikz >}}  
\begin{tikzpicture}[scale=1]
\definecolor{color1}{rgb}{0.9,0.9,0.9}
\definecolor{color3}{rgb}{0.75,0.75,0.75}
\definecolor{color2}{rgb}{0.6,0.6,0.6}
\coordinate[] (A1) at (-4.4,-0.2);
\coordinate[] (A2) at (-4.4,0.2);
\coordinate[] (A3) at (-4.4,1.8);
\coordinate[] (A4) at (-4.4,2.2);
\coordinate[] (B1) at (-4.0,2.0);
\coordinate[] (C1) at (-3.6,0.2);
\coordinate[] (C2) at (-3.6,2.2);
\coordinate[] (D1) at (-3.2,0);
\coordinate[] (D2) at (-3.2,2);
\coordinate[] (E1) at (-2.8,1);
\coordinate[] (F1) at (-2.4,1.2);
\coordinate[] (F2) at (-2.4,3.2);
\coordinate[] (F3) at (-2.4,3.6);
\coordinate[] (G1) at (-2,0.6);
\coordinate[] (G2) at (-2,1);
\coordinate[] (G3) at (-2,2.6);
\coordinate[] (G4) at (-2,3);
\coordinate[] (G5) at (-2,3.4);
\coordinate[] (G6) at (-2,3.8);
\coordinate[] (H1) at (-1.6,3.2);
\coordinate[] (H2) at (-1.6,3.6);
\coordinate[] (I1) at (-0.4,-0.2);
\coordinate[] (I2) at (-0.4,0.2);
\coordinate[] (I3) at (-0.4,0.6);
\coordinate[] (I4) at (-0.4,1.8);
\coordinate[] (J1) at (0,-2.4);
\coordinate[] (J2) at (0,-2);
\coordinate[] (J3) at (0,-1.6);
\coordinate[] (J4) at (0,-0.4);
\coordinate[] (J5) at (0,1.6);
\coordinate[] (J6) at (0,2);
\coordinate[] (J7) at (0,2.4);
\coordinate[] (K1) at (0.4,-0.2);
\coordinate[] (K2) at (0.4,1.8);
\coordinate[] (K3) at (0.4,2.2);
\coordinate[] (L1) at (1.6,-0.8);
\coordinate[] (L2) at (1.6,2.4);
\coordinate[] (M1) at (2,-1.4);
\coordinate[] (M2) at (2,-1);
\coordinate[] (M3) at (2,2.6);
\coordinate[] (M4) at (2,3);
\coordinate[] (M5) at (2,3.4);
\coordinate[] (N1) at (2.4,-1.2);
\coordinate[] (N2) at (2.4,-0.8);
\coordinate[] (N3) at (2.4,-0.4);
\coordinate[] (N4) at (2.4,2.4);
\coordinate[] (O1) at (3.6,0.2);
\coordinate[] (O2) at (3.6,1.8);
\coordinate[] (P1) at (4,0);
\coordinate[] (P2) at (4,2);
\coordinate[] (Q1) at (4.4,-0.2);
\coordinate[] (Q2) at (4.4,2.2);
\draw[line width=1pt,fill=color3] (A2)--(J2)--(M2)--(L1)--(J3)--(C1)--(G2)--(I2)--(I3)--(C2)--(G4)--(F2)--(A4)--(F1)--cycle;
\draw[line width=1pt,fill=color3] (N3)--(N2)--(P1)--(O1)--cycle;
\draw[line width=1pt,fill=color3] (Q2)--(M5)--(J7)--(H1)--(G4)--(J6)--(M4)--(P2)--cycle;
\draw[line width=1pt,fill=color2] (K1)--(J4)--(J6)--(M4)--(M3)--(K2)--cycle;
\draw[line width=1pt,fill=color2] (P2)--(P1)--(N2)--(N1)--(Q1)--(Q2)--cycle;
\draw[line width=1pt,fill=color2] (J2)--(J1)--(M1)--(M2)--cycle;
\draw[line width=1pt,fill=color2] (C2)--(D2)--(G3)--(G4)--cycle;
\draw[line width=1pt,fill=color2] (C1)--(D1)--(G1)--(G2)--cycle;
\draw[line width=1pt,fill=color2] (M3)--(M2)--(N2)--(N4)--cycle;
\draw[line width=1pt,fill=color1] (A4)--(A3)--(E1)--(F1)--cycle;
\draw[line width=1pt,fill=color1] (A2)--(A1)--(J1)--(J2)--cycle;
\draw[line width=1pt,fill=color1] (M3)--(M4)--(P2)--(P1)--(O1)--(O2)--cycle;
\draw[line width=1pt,fill=color1] (G4)--(G3)--(I4)--(I2)--(G2)--(G1)--(J4)--(J6)--cycle;
\draw[line width=1pt,fill=color1] (L2)--(L1)--(M2)--(M3)--cycle;
\draw[line width=1pt,fill=pink] (F3)--(F2)--(G4)--(G5)--cycle;
\draw[line width=1pt,fill=pink] (G5)--(G4)--(H1)--(H2)--cycle;
\draw[line width=1pt,fill=pink] (F3)--(G5)--(H2)--(G6)--cycle;
\draw[line width=1pt,fill=pink] (M1)--(N1)--(N2)--(M2)--cycle;
\end{tikzpicture}
{{< /tikz >}}  
</center>

如果上一个迷宫可能过于简单，这里再给出一个稍复杂一点的。
<center>
{{< tikz >}}
\begin{tikzpicture}[scale=1]
\definecolor{color1}{rgb}{0.9,0.9,0.9}
\definecolor{color3}{rgb}{0.75,0.75,0.75}
\definecolor{color2}{rgb}{0.6,0.6,0.6}
\coordinate[] (A1) at (-4.4,-4.2);
\coordinate[] (A2) at (-4.4,4.2);
\coordinate[] (A3) at (-4.4,4.6);
\coordinate[] (B1) at (-4,-4.4);
\coordinate[] (B2) at (-4,-0.4);
\coordinate[] (B3) at (-4,0);
\coordinate[] (B4) at (-4,1.6);
\coordinate[] (B5) at (-4,2);
\coordinate[] (B6) at (-4,3.6);
\coordinate[] (B7) at (-4,4);
\coordinate[] (B8) at (-4,4.4);
\coordinate[] (B9) at (-4,4.8);
\coordinate[] (C1) at (-3.6,-3.8);
\coordinate[] (C2) at (-3.6,-3.4);
\coordinate[] (C3) at (-3.6,-2.2);
\coordinate[] (C4) at (-3.6,-1.8);
\coordinate[] (C5) at (-3.6,-1.4);
\coordinate[] (C6) at (-3.6,-0.6);
\coordinate[] (C7) at (-3.6,0.2);
\coordinate[] (C8) at (-3.6,0.6);
\coordinate[] (C9) at (-3.6,1.4);
\coordinate[] (C10) at (-3.6,2.2);
\coordinate[] (C11) at (-3.6,3.4);
\coordinate[] (C12) at (-3.6,4.2);
\coordinate[] (C13) at (-3.6,4.6);
\coordinate[] (D1) at (-3.2,0);
\coordinate[] (E1) at (-2.8,-1);
\coordinate[] (E2) at (-2.8,1);
\coordinate[] (F1) at (-2.4,-1.2);
\coordinate[] (F2) at (-2.4,0.8);
\coordinate[] (G1) at (-2,-1.4);
\coordinate[] (G2) at (-2,-0.6);
\coordinate[] (G3) at (-2,0.6);
\coordinate[] (G4) at (-2,1.4);
\coordinate[] (H1) at (-1.6,-0.8);
\coordinate[] (H2) at (-1.6,1.2);
\coordinate[] (I1) at (-1.2,-1);
\coordinate[] (I2) at (-1.2,1);
\coordinate[] (J1) at (-0.8,-2);
\coordinate[] (J2) at (-0.8,0);
\coordinate[] (J3) at (-0.8,2);
\coordinate[] (K1) at (-0.4,-1.8);
\coordinate[] (K2) at (-0.4,0.2);
\coordinate[] (K3) at (-0.4,1.8);
\coordinate[] (L1) at (0,-2.4);
\coordinate[] (L2) at (0,-1.6);
\coordinate[] (L3) at (0,-0.4);
\coordinate[] (L4) at (0,0.4);
\coordinate[] (L5) at (0,1.6);
\coordinate[] (L6) at (0,2.4);
\coordinate[] (M1) at (0.4,-2.2);
\coordinate[] (M2) at (0.4,-0.2);
\coordinate[] (M3) at (0.4,2.2);
\coordinate[] (N1) at (0.8,-2);
\coordinate[] (N2) at (0.8,0);
\coordinate[] (N3) at (0.8,2);
\coordinate[] (O1) at (1.2,-1);
\coordinate[] (O2) at (1.2,1);
\coordinate[] (P1) at (1.6,-1.2);
\coordinate[] (P2) at (1.6,0.8);
\coordinate[] (Q1) at (2,-1.4);
\coordinate[] (Q2) at (2,-0.6);
\coordinate[] (Q3) at (2,0.6);
\coordinate[] (Q4) at (2,1.4);
\coordinate[] (R1) at (2.4,-0.8);
\coordinate[] (R2) at (2.4,1.2);
\coordinate[] (S1) at (2.8,-1);
\coordinate[] (S2) at (2.8,1);
\coordinate[] (T1) at (3.2,0);
\coordinate[] (U1) at (3.6,-3.8);
\coordinate[] (U2) at (3.6,-3.4);
\coordinate[] (U3) at (3.6,-2.2);
\coordinate[] (U4) at (3.6,-1.8);
\coordinate[] (U5) at (3.6,-1.4);
\coordinate[] (U6) at (3.6,-0.6);
\coordinate[] (U7) at (3.6,0.2);
\coordinate[] (U8) at (3.6,0.6);
\coordinate[] (U9) at (3.6,1.4);
\coordinate[] (U10) at (3.6,2.2);
\coordinate[] (U11) at (3.6,3.4);
\coordinate[] (U12) at (3.6,4.2);
\coordinate[] (V1) at (4,-4.4);
\coordinate[] (V2) at (4,-0.4);
\coordinate[] (V3) at (4,0);
\coordinate[] (V4) at (4,1.6);
\coordinate[] (V5) at (4,2);
\coordinate[] (V6) at (4,3.6);
\coordinate[] (V7) at (4,4);
\coordinate[] (V8) at (4,4.4);
\coordinate[] (W1) at (4.4,-4.2);
\coordinate[] (W2) at (4.4,4.2);
\draw[line width=1pt,fill=color3] (U7)--(U8)--(C12)--(B7)--cycle;
\draw[line width=1pt,fill=color3] (L6)--(M3)--(V7)--(U12)--cycle;
\draw[line width=1pt,fill=color3] (H2)--(K3)--(J3)--(G4)--cycle;
\draw[line width=1pt,fill=color3] (C7)--(F2)--(E2)--(C8)--cycle;
\draw[line width=1pt,fill=color3] (C5)--(C4)--(F1)--(E1)--cycle;
\draw[line width=1pt,fill=color3] (G2)--(H1)--(P2)--(O2)--cycle;
\draw[line width=1pt,fill=color3] (Q4)--(R2)--(V5)--(U10)--cycle;
\draw[line width=1pt,fill=color3] (R1)--(V3)--(U7)--(Q2)--cycle;
\draw[line width=1pt,fill=color3] (C2)--(C1)--(P1)--(O1)--cycle;
\draw[line width=1pt,fill=color3] (C10)--(B5)--(K2)--(L4)--cycle;
\draw[line width=1pt,fill=color3] (N2)--(M2)--(U4)--(U5)--cycle;
\draw[line width=1pt,fill=color3] (C7)--(B3)--(K1)--(L2)--cycle;
\draw[line width=1pt,fill=color3] (N1)--(M1)--(U1)--(U2)--cycle;
\draw[line width=1pt,fill=color2] (M3)--(N3)--(V6)--(V5)--(R2)--(S2)--(V4)--(V3)--(R1)--(S1)--(V2)--(V1)--(W1)--(W2)--cycle;
\draw[line width=1pt,fill=color2] (H2)--(I2)--(L5)--(K3)--cycle;
\draw[line width=1pt,fill=color2] (C7)--(D1)--(G3)--(F2)--cycle;
\draw[line width=1pt,fill=color2] (H1)--(I1)--(Q3)--(P2)--cycle;
\draw[line width=1pt,fill=color2] (B4)--(B3)--(C7)--(C9)--cycle;
\draw[line width=1pt,fill=color2] (B6)--(B5)--(C10)--(C11)--cycle;
\draw[line width=1pt,fill=color2] (B2)--(B1)--(Q1)--(P1)--(C1)--(C3)--(G1)--(F1)--(C4)--(C6)--cycle;
\draw[line width=1pt,fill=color1] (U11)--(U10)--(V5)--(V6)--cycle;
\draw[line width=1pt,fill=color1] (U9)--(U7)--(V3)--(V4)--cycle;
\draw[line width=1pt,fill=color1] (V2)--(U6)--(U4)--(M2)--(L3)--(U3)--(U1)--(M1)--(L1)--(V1)--cycle;
\draw[line width=1pt,fill=color1] (T1)--(U7)--(A2)--(A1)--(B1)--(B2)--(J1)--(K1)--(B3)--(B4)--(J2)--(K2)--(B5)--(B6)--cycle;
\draw[line width=1pt,fill=pink] (U12)--(V7)--(W2)--(V8)--cycle;
\draw[line width=1pt,fill=pink] (A3)--(A2)--(B7)--(B8)--cycle;
\draw[line width=1pt,fill=pink] (B8)--(B7)--(C12)--(C13)--cycle;
\draw[line width=1pt,fill=pink] (B9)--(A3)--(B8)--(C13)--cycle;
\end{tikzpicture}
{{< /tikz >}}
</center>

