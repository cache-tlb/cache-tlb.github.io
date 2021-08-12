# How to Become an Advanced Graphics Programmer


本文翻译自 Eric Arnebäck 的一条 [推文](https://twitter.com/erkaman2/status/1004031184551206912)，作者提出了图形程序员进阶的一些中肯的建议。我觉得其中有不少值得借鉴的点。

如果你已经可以无碍地听懂 GDC 和 siggraph 的最新的报告和论文，并且可以用相对合理的时间实现出来，那么你已经是很资深的图形程序员了，会有大量游戏公司向你抛来橄榄枝。那么我是如何做到的呢？

我建议每个新手图形程序员都实现一个自己的 mini 渲染引擎，包括以下功能：
* 粒子系统
* 水和动态反射
* 环境光遮蔽
* 延迟渲染
* 视锥体裁剪
* 阴影渲染
* 抗锯齿

等等。实现一个功能齐全的渲染引擎，是从新手到熟手的最好途径。

每当实现完一个高级的功能，一定要写一篇博客详细介绍。既可以让你更深入地思考自己所实现的东西，也可以提升技术交流的水平，这对于工业界是非常重要的能力。将博客分享给其他人，同行的讨论能给你更多启发。

对业界的动态保持关注，每周都读一下最新的 paper，和大佬发的最新博客及推文。

如果没时间从头到尾地读论文，可以跳过某些部分，直到自己能掌握论文背后的主旨。论文里往往包含大量细节内容，这些只在你真的坐下来亲自去实现它的时候有用。于我而言，了解主旨基本就足够了。

以后在项目中引入一个论文的工作，只要掌握它的大体思路。

我认为资深图形程序员的一个主要的特点就是可以用相对合理的时间量实现最新的 siggraph / EG 等会议的论文。关于如何实现论文，又有几点看法。

首先从头到尾读几遍论文，重点关注“方法”部分。从这部分提炼出“最简可行的原型”，也就是抛去各种优化，先不关注性能，而是思考如何用最简单的方式实现它。有了实现方案以后接着思考：将它用自己的引擎实现出来有多困难？它的效果能否达到我想要的水准？

考虑好之后就可以琢磨如何优化和实现论文的高级部分。

实现论文一个重要的点是要有能比较的 ground truth。比如实现一个实时间接光算法，你需要同时实现一个 path tracer（基于 Mistuba 或 embree）。又比如实现一个 shadow map 的 filter 算法，肯定也要跟 PCF 进行比较。

对于一些非常篇数学和抽象的论文，很难立马想到如何将它翻译成代码，以下是一些建议：

* 多数情况下，计算积分就是求和
* 集合的记号用数组来实现
* 经常会遇到的最小化的问题，可以通过找梯度为 0 的点来解
* 求解偏微分方程（PDE）可以转化成有限差分（finite difference）
* 遇到大矩阵不要怕，它们一般都是用来表示许多小的简单的等式的联立
* **永远不要试图自己实现线性系统求解器，而是用 Eigen 库**
* 简化问题，比如想象输入的 mesh 只有一个或几个三角形，代入公式中看看会变成什么样，这有助于加深理解
* 考虑三维情况之前，先考虑二维甚至一维下的情况

更多建议：

* 阅读参考文献中的论文，它们可能对一些概念有更容易理解的解释
* 很多人会在硕士论文中实现 siggraph 论文，里面有大量宝贵的实现细节，可供参考
* 有些论文其实本身就写的很晦涩，可以给作者发邮件问清楚
* 可以询问同事，或者在 twitter 上问专家

下面是一些优化论文实现的建议：

* 学会使用性能分析工具，比如 NVidia Nsight，可以快速定位代码中的 hotspot
*  读 [这篇文章](https://developer.nvidia.com/blog/the-peak-performance-analysis-method-for-optimizing-any-gpu-workload/)
* 使用版本控制工具，这样可以知道哪些修改会影响性能

---

最近读到安柏霖先生的[博文](https://blog.csdn.net/toughbro/article/details/115260139)，里面提到了各种职级的程序员应该具备的水平，比如 T8 - T9 级别（工作2-3年，正常晋升）应该可以轻松落地单点技术（比如战神的风场），T10 - T11 级别要能负责系统级别技术（没举例子，大概是地形系统、粒子系统、动画系统等吧）。

离题一句，安柏霖在这里主要是讨论“隐性知识”的重要性。这是书上和论文中不讲，但对于游戏开发至关重要的东西，非常琐碎。比如工具链、兼容性。相比之下，“显性知识”，也就是出现在各种高大上论文里的核心技术，其实是难度最小的部分，属于冰山浮在水面的那一块。更多的时间其实是要花在解决冰山的水下部分。

---

再多一些题外话。关于冰山的比喻还可以进一步推广，在整个游戏开发周期中，游戏画质、性能这些高精尖的硬性指标固然需要投入大量的程序、美术、TA的时间，但这些仍然只是冰山看得见的部分。隐藏在冰山下的是游戏节奏、手感、叙事等方面的打磨，因为难以量化，所以几乎很难有指导方向。

---

下面是 Eric Arnebäck 推特原文：

> How To become an advanced graphics programmer:
> Some general advice and tips from me, an expert graphics programmer
> huge thread below.
> 
> If you are at the level at which you can comfortably
> read e.g. advanced GDC presentations and siggraph papers, and
> then implement them by youself in an reasonable amount of time,
> I consider you an advanced graphics programmer,
> 
> and plenty of game companies would probably be interested in your skills.
> How can we acquire this level of skill? I shall tell you how I did it!
> 
> Something that I think all beginning graphics programmers should do,
> is implement their own little rendering engine. I did this when I was a 
> beginner, and implemented things like:
> 
> * rendering of particle systems
> * water rendering, with dynamic reflections
> * ambient occlusion'
> * deferred rendering 
> * view frustum culling
> * shadow rendering
> * anti aliasing.
> 
> and so on and so forth. working on a rendering engine and implementing
> all kinds of rendering features, is IMO the best way to go from
> beginner to intermediate.
> 
> * Whenever you implement something suffienctly advanced, make sure to
> write a blog post about it. Writing blog posts allows you to deepen your understanding
> of what you've implemented, and improves your communication skills, which
> is very important in this industry.
> 
> and also, sharing your blog posts with people, often results in interesting
> discussions with other graphics programmer, and this deepens your understanding
> even more.
> 
> * Make an active effort to keep up with the latest developements
> in the field. Every week, read the latest blog posts, and latest papers that 
> people post on twitter.
> 
> Note that there is not always time to read all the new papers from beginning to end.
> in this situation, I think it is enough to skim the paper, and skim until
> you understand the main idea behind the paper.
> 
> Papers can contain lots of nitty gritty details, but I think these are only
> necessary to understand, if you are really gonna sit down and implement the paper
> yourself. But if you're pressed for time, understanding the main idea
> is more than enough in my opinion.
> 
> If you have the main idea of the paper understood, then that is enough when you want to
> incorporate the technique into your future projects
> 
> IMO the main characteristic of an advanced graphics programmer, is being able to implement an advanced siggraph/eurographics/etc paper within a reasonable amount of time.
> How do we implement a paper? Below is my technique.
> 
> read the paper from beginning to end a couple of times. The section I usually
> spend most of my efforts is often called "method".
> 
> from this section, extract a minimum viable prototype. That is, strip away
> all possible optimizations, and figure out how to implement the technique
> as simple as possible, disregarding things like performance.
> 
> once we have a prototype on our hands we can already evaluate a couple of things:
> how difficult is it to integrate into our current engine?(very important in the real world)
> is the visual quality of this technique good enough for our purposes?
> 
> once this has been evaluated, we can start looking into implementing optimizations
> and adding the advanced parts of the technique.
> 
> * one thing I think is very important when implementing papers, is that we 
> have a "ground truth" to compare with. e.g., if implementing a real-time
> indirect illumination technique,
> 
> then you should also implement a path tracer alongside(e.g. with Mitsuba or embree), 
> so that you have a ground truth you can compare your implementation with.
> 
> or if you are implementing a shadow map filtering technique, you should
> certainly compare your technique with PCF filtering.
> 
> * some papers are very mathematical and abstract, and it can be hard to figure out
> exactly how they should be translated to code. Some small tips when
> translating math to code:
> 
> * An integral is just a big sum, in most cases.
> * set notation is often just used as a fancy way of showing arrays in a paper.
> 
> * minimization problems often occur, and the way you often solve them, is by finding the
> point at which the gradient is zero
> 
> * PDEs can be converted to code with finite difference schemes, e.g. central differences
> 
> * big matrices are NOT scary.  they are often just used to combine many small simple equations, 
> into one big equation.  that is, they are just a colletion of many small pieces of information.
> 
> * NEVER EVER WRITE YOUR OWN LINEAR SOLVER(for production purposes). use Eigen instead.
> 
> * simplify, simplify, simplify. consider how the math formulas would look like, 
> if the input mesh just consists of a single triangle. walk through the math formulas
> for such a single triangle mesh. this often makes it much easier to understand
> the math formulas
> 
> * examine the two-dimensional, or even one-dimensional case, before even considering the 3D case.
> 
> if you still are having trouble understanding the paper, some more tips:
> 
> * read the papers in the reference list. they might explain some concepts in an easier way
> * people often implement siggraph papers in their master's thesis, and provide many valuable implementation details in their thesis. Try to find such thesis!
> 
> * some papers are, frankly speaking, poorly written, and therefore hard to understand. try mailing the authors for clarifications!
> * try asking your colleagues, or experts on twitter(like me) for help
> 
> Now, some general advice for optimizing your implementations, since this is also
> an important part of implementing a paper:
> 
> * learn how to use performance profiling tools, such as nvidia nsight.
> these tools how you to quickly locate hotspots in your code.
> 
> * read this article: https://developer.nvidia.com/blog/the-peak-performance-analysis-method-for-optimizing-any-gpu-workload/
> 
> * use version control, so that you can easily locate changes that caused performance
> degradations.
> 
> alright! that was all for now. I'll add more, if I come up with it.

