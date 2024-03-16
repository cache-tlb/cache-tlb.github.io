# UE4 MovieRenderPipeline 以及在 Vulkan 下的重影问题


最近在折腾用 Linux 的集群做 UE4 的离屏渲染（off-screen rendering）。UE4 官方提供了一个用于渲染过场动画的 Movie Render Queue 插件。
虽然还只是 Beta 版，但主要功能已经能用并且能满足离线出片的基础需求，有现成的为什么不用呢？

Movie Render Queue 在编辑器里是一个非常简单的窗口，用户选择一个或多个 LevelSequence，然后发起渲染。可以是本机或远程渲染。
这里的 LevelSequence 是一种 UE4 的资源文件，它描述了动画里的每一个镜头（camera cut）的起止帧、相机参数，还有每个 Actor 的关键帧数据，比如 CameraActor 就只有平移、旋转、缩放，而 CineCameraActor 在此基础上还可以设焦距。
此外还可以指定在某一帧触发蓝图，播放骨骼动画，等等。
它的输出功能也十分强大，除了最终渲染结果，还可以保存渲染的中间结果，比如 Lighting Only，Unlit，甚至 Object Id 都可以存下来。这对于做深度学习的朋友来说又多了一条生成数据的途径。古有用 GTA5 生成的图像数据训练自动驾驶，今有用 UE4 的 Movie Render Queue 生成数据做视频语义分割，我们都有光明的未来。

这些都是题外话。

Movie Render Queue 的功能也开放了对应的调用接口，用户可以在蓝图中发起渲染任务，效果跟在编辑器中操作一样，具体做法请参考[官方文档](https://docs.unrealengine.com/4.26/en-US/AnimatingObjects/Sequencer/Workflow/RenderAndExport/HighQualityMediaExport/RuntimeBuilds/)。
蓝图里需要指定必要的输入信息，包括 LevelSequence 路径，拍摄场景的 Map 路径，输出的图像格式、分辨率，输出目录等等。
值得一提的是，这里发起渲染任务的蓝图可以在离屏模式下运行，这正是我们所需要的。

我们将官方文档的蓝图翻译成 C++ 代码，加入到我们定制的管线中，大功告成，在 Windows 下打包测试，一切正常，十分顺利。中间有一个小插曲是如何动态生成 LevelSequence 和如何指定使用当前运行中的 Map 进行拍摄（编辑器和蓝图版本中指定一个 Map 的含义是重新加载该 Map 到 Movie Render Pipeline 里并渲染，所以当前场景中的任何修改在渲染出来的结果中都是无法体现的。好在 C++ 代码里暴露了更多选项以满足我们的需求），然而这些都不是重点。

上 Linux 一测立刻发现问题：所有输出的图像都出现了 ghost，即在每一帧的图像都有上一帧的残影。
因为 Linux 下渲染使用的 RHI 是 Vulkan，所以我第一时间又在 Windows 下用 Vulkan 跑了一遍，也是同样的问题。不甘心的我又在官方自带的 Blank 场景，自己构造了一个简单的 LevelSequence，只不过换成用 Vulkan 运行，也有同样的问题，但同样的情况用 DX 就是正常的，这就排除了我们自己的场景和设置的原因。就是说 Windows 下 DX11 和 Vulkan 拍的效果不一致。直觉告诉我麻烦可能有点大。

又做了一些简单尝试，仍没有什么实质性的进展，只好硬着头皮看代码了。
找来找去发现可以通过设置输出每个 spatial sample 对应的渲染图，进而发现 Vulkan 下前 3 张图像是全黑的，以后每一帧的 sample 都会落后 3 张图，比如第一帧的最后 3 个 sample 会算作第二帧前 3 个 sample，以此类推。前几帧这个规律还比较稳定，帧数多了之后前后帧的 sample 完全混在一起，不能用简单把所有sample都往前挪 3 个这样的 ad-hoc 的方法粗暴解决。于是继续看代码，梳理逻辑。

代码可以从 `void UMoviePipeline::RenderFrame()` 函数入手，有一个 for 循环，对每个 spatial sample 调用一次 `RenderPass->RenderSample_GameThread(SampleState)`，
这里的 RenderPass 指的是 Movie Pipeline 保存哪些 pass 的内容，比如 Deferred Base，Unlit，Light Only，等等。
最常用的就是 Deferred Base，也就是 Deferred Rendering 最终输出的颜色。
`RenderSample_GameThread` 函数最终会调用到对应 RenderPass 的 `RenderSample_GameThreadImpl`函数。
对于 `UMoviePipelineDeferredPassBase` 来说，逻辑如下：
首先将场景渲染到 RenderTarget 上，接着将 RenderTarget 的内容拷贝到纹理 ReadbackTexture，然后回读 ReadbackTexture 到内存，最后把内存的图像数据做累加。
这里涉及到几个线程：主线程（Game Thread）上跑的是整个引擎的主循环，负责调用游戏各个系统的更新逻辑。
渲染线程（Render Thread）可以看成是一个处理任务队列的线程，别的线程发来一个命令就处理一个。通常是主线程根据场景中要画的物体提交一系列渲染任务放在渲染线程执行。
主线程提交到渲染线程的任务的执行顺序跟提交顺序是一致的。

`RenderSample_GameThreadImpl`函数从名字上看是要执行在主线程上，对应的代码如下：
``` cpp
void UMoviePipelineDeferredPassBase::RenderSample_GameThreadImpl(const FMoviePipelineRenderPassMetrics& InSampleState)
{
    Super::RenderSample_GameThreadImpl(InSampleState);

    // Wait for a surface to be available to write to. This will stall the game thread while the RHI/Render Thread catch up.
	{
		SCOPE_CYCLE_COUNTER(STAT_MoviePipeline_WaitForAvailableSurface);
		SurfaceQueue->BlockUntilAnyAvailable();
	}

    // 省略了一些准备工作代码
    // ...

    FRenderTarget* RenderTarget = GetViewRenderTarget()->GameThread_GetRenderTargetResource();
    FCanvas Canvas = FCanvas(RenderTarget, nullptr, GetPipeline()->GetWorld(), ERHIFeatureLevel::SM5, FCanvas::CDM_DeferDrawing, 1.0f);
    GetRendererModule().BeginRenderingViewFamily(&Canvas, ViewFamily.Get());

    // Readback + Accumulate.
    PostRendererSubmission(InOutSampleState, PassIdentifier, GetOutputFileSortingOrder(), Canvas);
}
```
它首先会等待 SurfaceQueue。
SurfaceQueue 存了一些 ReadbackTexture，当主线程超前渲染线程太多帧，所有的 ReadbackTexture 都在被占用，就需要阻塞主线程，直到有可用的。
然后获得一个 RenderTarget，用来承接渲染结果。
接着调用了 `BeginRenderingViewFamily` 函数，可以看成是提交了整个场景渲染的全部命令到渲染线程。这些命令一旦执行完，我们指定的 RenderTarget 上就有渲染结果了。

`PostRendererSubmission` 函数提交了额外的命令到渲染线程，以便于将 RenderTarget 上的图像内容复制到 ReadbackTexture 上，并回读到内存中，后续好做累加并存文件。
代码逻辑如下：
``` cpp
void UMoviePipelineDeferredPassBase::PostRendererSubmission(const FMoviePipelineRenderPassMetrics& InSampleState, const FMoviePipelinePassIdentifier InPassIdentifier, const int32 InSortingOrder, FCanvas& InCanvas)
{
    // 准备工作，代码略
    // ...

    MoviePipeline::FImageSampleAccumulationArgs AccumulationArgs;
	{
		AccumulationArgs.OutputMerger = GetPipeline()->OutputBuilder;
		AccumulationArgs.ImageAccumulator = StaticCastSharedPtr<FImageOverlappedAccumulator>(SampleAccumulator->Accumulator);
		AccumulationArgs.bAccumulateAlpha = bAccumulatorIncludesAlpha;
	}

	auto Callback = [this, FramePayload, AccumulationArgs, SampleAccumulator](TUniquePtr<FImagePixelData>&& InPixelData)
	{
		bool bFinalSample = FramePayload->IsLastTile() && FramePayload->IsLastTemporalSample();
		bool bFirstSample = FramePayload->IsFirstTile() && FramePayload->IsFirstTemporalSample();

		FMoviePipelineBackgroundAccumulateTask Task;
		// There may be other accumulations for this accumulator which need to be processed first
		Task.LastCompletionEvent = SampleAccumulator->TaskPrereq;

		FGraphEventRef Event = Task.Execute([PixelData = MoveTemp(InPixelData), AccumulationArgs, bFinalSample, SampleAccumulator]() mutable
		{
			// Enqueue a encode for this frame onto our worker thread.
			MoviePipeline::AccumulateSample_TaskThread(MoveTemp(PixelData), AccumulationArgs);
			if (bFinalSample)
			{
				// Final sample has now been executed, break the pre-req chain and free the accumulator for reuse.
				SampleAccumulator->bIsActive = false;
				SampleAccumulator->TaskPrereq = nullptr;
			}
		});
		SampleAccumulator->TaskPrereq = Event;

		this->OutstandingTasks.Add(Event);
	};

	FRenderTarget* RenderTarget = InCanvas.GetRenderTarget();

	ENQUEUE_RENDER_COMMAND(CanvasRenderTargetResolveCommand)(
		[LocalSurfaceQueue, FramePayload, Callback, RenderTarget](FRHICommandListImmediate& RHICmdList) mutable
		{
			// Enqueue a encode for this frame onto our worker thread.
			LocalSurfaceQueue->OnRenderTargetReady_RenderThread(RenderTarget->GetRenderTargetTexture(), FramePayload, MoveTemp(Callback));
		});
}
```

其核心就是最后一句 `ENQUEUE_RENDER_COMMAND`，往渲染线程加入一个任务。
所以到此为止场景还没有开始渲染，要等渲染线程中的渲染场景的命令执行完才能拿到渲染结果（其实也不是真正执行完，渲染指令会由 RHI Command List 交给 RHI 线程执行）。
为了保证时序，将 RenderTarget 拷到 ReadbackTexture 的任务也需要放在渲染线程，往任务队列加入一个命令。
这个命令实际上就是调用 `FMoviePipelineSurfaceQueue::OnRenderTargetReady_RenderThread`函数。从名字也可以看出来，这个函数要执行在渲染线程。
函数定义如下：

``` cpp
void FMoviePipelineSurfaceQueue::OnRenderTargetReady_RenderThread(const FTexture2DRHIRef InRenderTarget, TSharedRef<FImagePixelDataPayload, ESPMode::ThreadSafe> InFramePayload, TUniqueFunction<void(TUniquePtr<FImagePixelData>&&)>&& InFunctionCallback)
{
	ensure(IsInRenderingThread());

	// Pick the next destination surface and ensure it's available.
	FResolveSurface* NextResolveTarget = &Surfaces[CurrentFrameIndex];
	if (!NextResolveTarget->Surface.IsAvailable())
	{
		// BlockUntilAnyAvailable should have been called before submitting more work. We can't block
		// until a surface is available in this callback because we'd be waiting on the render thread
		// from the render thread.
		check(false);
	}

	NextResolveTarget->Surface.Initialize();
	NextResolveTarget->FunctionCallback = MoveTemp(InFunctionCallback);
	NextResolveTarget->FunctionPayload = InFramePayload;

	// Queue this sample to be copied to the target surface.
	NextResolveTarget->Surface.ResolveSampleToReadbackTexture_RenderThread(InRenderTarget);

	// By the time we get to this point, our oldest surface should have successfully been rendered to, and no longer be in use by the GPU.
	// We can now safely map the surface and copy the data out of it without causing a GPU stall.
	{
		const int32 PrevCaptureIndexOffset = FMath::Clamp(FrameResolveLatency, 0, Surfaces.Num() - 1);

		// Get PrevCaptureIndexOffset surfaces back, handling wraparound at 0.
		const int32 PrevCaptureIndex = (CurrentFrameIndex - PrevCaptureIndexOffset) < 0 ? Surfaces.Num() - (PrevCaptureIndexOffset - CurrentFrameIndex) : (CurrentFrameIndex - PrevCaptureIndexOffset);

		FResolveSurface* OldestResolveTarget = &Surfaces[PrevCaptureIndex];

		// Only try to do the readback if the target has ever been written to.
		if (OldestResolveTarget->Surface.WasEverQueued())
		{
			SCOPE_CYCLE_COUNTER(STAT_MoviePipeline_SurfaceReadback);
			OldestResolveTarget->Surface.CopyReadbackTexture_RenderThread(MoveTemp(OldestResolveTarget->FunctionCallback), OldestResolveTarget->FunctionPayload);
		}
	}


	// Write to the next available surface next time.
	CurrentFrameIndex = (CurrentFrameIndex + 1) % Surfaces.Num();
}
```

本质上做了两件事：一是拷贝 RenderTarget 到 ReadbackTexture（代码中的 FResolveSurface 类），二是回读 ReadbackTexture 到内存。
对应的函数分别是 `ResolveSampleToReadbackTexture_RenderThread` 和 `CopyReadbackTexture_RenderThread`。
但仔细一点看可以发现这两个 ReadbackTexture 并不是同一个。实际上 FMoviePipelineSurfaceQueue 类里存了 3 份 FResolveSurface。
第 0 帧将 RenderTarget_0 拷贝到 ReadbackTexture_0，并尝试回读 ReadbackTexture_2，但因为还没有 RenderTarget 拷贝到 ReadbackTexture_2 上面过，所以没有回读。
第 1 帧将 RenderTarget_1 拷贝到 ReadbackTexture_1，并将 ReadbackTexture_0 回读。
第 2 帧将 RenderTarget_2 拷贝到 ReadbackTexture_2，并将 ReadbackTexture_1 回读。等等。

之前将每个 spatial sample 图像存出来发现有 3 帧的延迟，可能就跟 3 组 FResolveSurface 有关。
`ResolveSampleToReadbackTexture_RenderThread` 拷贝 RenderTarget 的做法是用后处理的做法画一个全屏四边形逐像素复制的。
`CopyReadbackTexture_RenderThread` 先是回读到内存，然后调用一个回调函数做 spatial sample 的累加，代码如下：

``` cpp
void FMoviePipelineSurfaceReader::CopyReadbackTexture_RenderThread(TUniqueFunction<void(TUniquePtr<FImagePixelData>&&)>&& InFunctionCallback, TSharedPtr<FImagePixelDataPayload, ESPMode::ThreadSafe> InFramePayload)
{
	// We use GetModuleChecked here to avoid accidentally loading the module from the non-main thread.
	static const FName RendererModuleName("Renderer");
	IRendererModule* RendererModule = &FModuleManager::GetModuleChecked<IRendererModule>(RendererModuleName);

	FRHICommandListImmediate& RHICmdList = GetImmediateCommandList_ForRenderCommand();
	{
		void* ColorDataBuffer = nullptr;

		int32 ActualSizeX = 0, ActualSizeY = 0;
		RHICmdList.MapStagingSurface(ReadbackTexture, ColorDataBuffer, ActualSizeX, ActualSizeY);
		int32 ExpectedSizeX = Size.X;
		int32 ExpectedSizeY = Size.Y;

		TUniquePtr<FImagePixelData> PixelData;
		uint8* TypeErasedPixels = nullptr;
		int32 SizeOfColor = 0;
		switch (PixelFormat)
		{
		case EPixelFormat::PF_FloatRGBA:
		{
			TUniquePtr<TImagePixelData<FFloat16Color>> NewPixelData = MakeUnique < TImagePixelData<FFloat16Color>>(FIntPoint(Size.X, Size.Y), InFramePayload);
			NewPixelData->Pixels.SetNumUninitialized(ExpectedSizeX * ExpectedSizeY);
			SizeOfColor = sizeof(FFloat16Color);
			TypeErasedPixels = reinterpret_cast<uint8*>(NewPixelData->Pixels.GetData());
			PixelData = MoveTemp(NewPixelData);
			break;
		}
		case EPixelFormat::PF_B8G8R8A8:
		{
            // 略
		}
		default:
			check(0); // Unsupported, add a new switch statement.
		}


		// Due to padding, the actual size might be larger than the expected size. If they are the same, do a block copy. Otherwise copy
		// line by line.
		if (ExpectedSizeX == ActualSizeX && ExpectedSizeY == ActualSizeY)
		{
			FMemory::BigBlockMemcpy(TypeErasedPixels, ColorDataBuffer, (ExpectedSizeX * ExpectedSizeY) * SizeOfColor);
		}
		else
		{
            // 略
		}

		// Enqueue the Unmap before we broadcast the resulting pixels, though the broadcast shouldn't do anything blocking.
		RHICmdList.UnmapStagingSurface(ReadbackTexture);

		InFunctionCallback(MoveTemp(PixelData));

		// Now that we've successfully used the surface, we trigger the Available event so that we can reuse this surface. This
		// triggers the Available event and then returns it to the pool.
		Reset();
	}
}
```

这里的 `InFunctionCallback` 实际上就是之前在 `PostRendererSubmission` 里定义的 Callback。
Callback里又生成了一个异步计算的任务，在其中调用 `AccumulateSample_TaskThread` 函数，除了累加之外，`AccumulateSample_TaskThread` 还会根据设置决定是否将每个累加的 sample 存盘。
这里存盘又是通过 ImageWriteQueue 这个线程做的。涉及到异步的过程都有问题，于是将 Callback 和存盘都改成同步。
并且在 `PostRendererSubmission` 后面用了一个 `FlushRenderingCommands()`，
在 `ResolveSampleToReadbackTexture_RenderThread` 和 `CopyReadbackTexture_RenderThread` 加入 `RHICmdList.ImmediateFlush()`，
前者是等待 RenderThread 的命令全部执行完，后者是强制让 RHI 执行现有的 Command List，并等待完成。
结果问题依旧。

难道是 Flush 的用法不对？笔者尝试在 UE4 的源码中搜索其他类似的带有回读纹理的代码，发现 `RHICmdList.MapStagingSurface` 的用法各有区别，别的地方有些是带了 Fence 参数，这里没有带。
一路跟到 `FVulkanDynamicRHI::RHIMapStagingSurface` 函数，如下：
``` cpp
void FVulkanDynamicRHI::RHIMapStagingSurface(FRHITexture* TextureRHI, FRHIGPUFence* FenceRHI, void*& OutData, int32& OutWidth, int32& OutHeight, uint32 GPUIndex)
{
	FRHITexture2D* TextureRHI2D = TextureRHI->GetTexture2D();
	check(TextureRHI2D);
	FVulkanTexture2D* Texture2D = ResourceCast(TextureRHI2D);

	if (FenceRHI && !FenceRHI->Poll())
	{
		FRHICommandListExecutor::GetImmediateCommandList().ImmediateFlush(EImmediateFlushType::FlushRHIThread);
		Device->SubmitCommandsAndFlushGPU();
		FVulkanGPUFence* Fence = ResourceCast(FenceRHI);
		Device->GetImmediateContext().GetCommandBufferManager()->WaitForCmdBuffer(Fence->GetCmdBuffer());
	}
	else
	{
		if(GVulkanFlushOnMapStaging)
		{
			FRHICommandListExecutor::GetImmediateCommandList().ImmediateFlush(EImmediateFlushType::FlushRHIThread);
			Device->WaitUntilIdle();
		}
	}


	check((Texture2D->Surface.UEFlags & TexCreate_CPUReadback) == TexCreate_CPUReadback);
	OutData = Texture2D->Surface.GetMappedPointer();
	Texture2D->Surface.InvalidateMappedMemory();
	OutWidth = Texture2D->GetSizeX();
	OutHeight = Texture2D->GetSizeY();
}
```
如果函数带了 Fence 参数会等待 Fence，不带 Fence 但设了 `GVulkanFlushOnMapStaging` 则会 Flush RHI Command List。
否则就什么都不做，直接 Map。这也是本例的情况。
看上去很容易出错的样子，可能会导致前面使用该纹理作为 RenderTarget 还没写完，后面就要将它回读了。
渲染线程中，不管是场景渲染还是 `ResolveSampleToReadbackTexture` ，也都只是发了一个命令到 RHI 线程，实际执行 Vulkan API 在 RHI 线程。
而 `RHIMapStagingSurface` 却是在渲染线程调用，所以 RHI 线程还没执行上一帧的渲染任务是合理的。

下面的时序图说明了这几个线程之间的关系。

{{< image src="mrq_threads.svg" title=" " width="100%" >}}

从上到下表示时间行进方向，三列分别表示了三个线程。每个线程的数字表示执行的任务在逻辑上的帧号。实线箭头表示一个线程向另一个线程的任务队列里添加一组命令。
通常来说，主线程向渲染线程提交命令是通过 `ENQUEUE_RENDER_COMMAND` 宏，渲染线程向 RHI 线程提交命令是通过 `RHICommandList` 的各个成员函数。
但反过来，`RHICommandList` 也有一些成员函数实际调用的是带了 `_RenderThread` 后缀的函数，他们是在渲染线程运行的，而非 RHI 线程。

在这个例子中，第 1 帧渲染线程的 CopyReadbackTexture 理论上应该等第 0 帧的 ResolveSampleToReadbackTexture 对应的 RHI 命令全部完成才能执行，但 Vulkan 版本没有等。只要 RHI 线程延迟足够大，回读到内存的图像就是上次残留的版本。
先试试最简单的把 `GVulkanFlushOnMapStaging` 改成 true，只要启动时加上 `r.Vulkan.FlushOnMapStaging 1` 选项就行。

居然就成功了。不过这会造成 CPU 和 GPU 占用率都过低。改用 Fence 试试，具体做法是为每个 ReadbackTexture 创建一个 Fence 对象，在 `ResolveSampleToReadbackTexture_RenderThread` 画全屏四边形的 pass 结束后调用 `RHICmdList.WriteGPUFence(Fence);`
并且在 `CopyReadbackTexture_RenderThread` 里的 `RHICmdList.MapStagingSurface` 函数传入这个 Fence 作为参数。
也正确了。因为用 Fence 可以不必清空 Command List，所以 CPU 和 GPU 的占用率也上去了。

至此，Windows Vulkan 下的 Movie Pipeline 能正常工作了。到 Linux 上又有一些问题，
比如每次必定触发 Fence 的等待，只好增加 ReadbackTexture （亦即SurfaceQueue）的个数，让 `ResolveSampleToReadbackTexture` 和 `CopyReadbackTexture` 之间间隔的帧数更多。
这样又会造成莫名其妙 deadlock，不得不在必要的地方加上 `FlushRenderingCommands()`。

终于 Linux 也能正常工作了，比起用设 r.Vulkan.FlushOnMapStaging 的方法，速度可以提升 3 倍。


