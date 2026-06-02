# Volumetric LightMap



Volumetric LightMap（简称VLM）是 UE 中存储静态场景在空间中产生的间接光照的一种数据结构，类似其他引擎或文献中的 irradiance volume 或 light probe。

## VLM的官方文档
VLM的[官方文档在此](https://docs.unrealengine.com/4.27/en-US/RenderingAndGraphics/Lightmass/VolumetricLightmaps/)，
本文摘录一些重点。

### 如何使用 
默认设置下，点 Build Light Only 就会自动构建 VLM，probe的覆盖范围是场景的 **static mesh**，如果场景中有 Lightmass Importance Volume，则probe只在 Lightmass Importance Volume 标识的范围内生成，如果有多个 Lightmass Importance Volume，则相当于有一个大的 bounding box包住了所有的Lightmass Importance Volume，probe会在这个大的 bounding box 范围内生成。此时如果有 static mesh（整个mesh或其中一部分）未被Lightmass Importance Volume覆盖，则没被覆盖的地方不一定会生成 probe。

**probe的排列总是对齐世界空间的xyz轴的。** 在主视口的visualize里选 `Volumetric LightMap` 即可预览 probe的位置。需要Build Light之后才会刷新 probe的位置。

### 配置项
在 World Settings 里，LightMass->LightMass Settings->Volume Light Method，选择Volumetric Lightmap即可，它也是默认选项。此外还有
- Volumetric Lightmap Detail Cell Size：最精细一级的 Brick 在世界空间的长度（两个probe之间的最近距离）
- Volumetric Lightmap Maximum Brick Memory Mb：VLM 总共最多耗多少 M内存，如果超过预算，优先丢掉离static mesh远的 Brick。
- Volumetric Lightmap Spherical Harmonic Smoothing：Spherical Harmonic de-ringing时用到的参数。


### 补充
Volumetric Lightmap 的组成单元为 4x4x4 的 cell，称为一个 `Brick`。

Brick覆盖范围有大有小，精细的 Brick 覆盖于模型表面，粗的 Brick 覆盖更大的范围。他们之间是包含关系，精细的 Brick 总是会被一个粗一级的 Brick所包含。形成树形结构。

不管 Brick 是粗还是细，都是4x4x4个probe，包含的数据量相同。

## 代码逻辑

### Swam 导出代码

UnrealLightmass 烘焙完 VLM后需要通过Swam导回UE4，导出数据的代码在 `Engine\Source\Programs\UnrealLightmass\Private\ImportExport\Exporter.cpp`，函数是`FLightmassSolverExporter::ExportResults`。

导出了 Bricks 数量个结构体，每个 Brick 结构体包含下面的数据：
``` cpp
struct FIrradianceBrickData
{
	FGuid IntersectingLevelGuid;
	/** Position in the global indirection texture.  Used for mapping brick positions back to world space. */
	FIntVector IndirectionTexturePosition;
	/** Depth in the refinement tree, where 0 is the root. */
	int32 TreeDepth;
	float AverageClosestGeometryDistance;
	TArray<FFloat3Packed> AmbientVector;
	TArray<FColor> SHCoefficients[6];
	TArray<FColor> SkyBentNormal;
	TArray<uint8> DirectionalLightShadowing;
	/** direct lighting from stationary lights for low quality light maps. */
	TArray<FFloat3Packed> LQLightColor;
	TArray<FColor> LQLightDirection;
	TArray<FIrradianceVoxelImportProcessingData> VoxelImportProcessingData;
};
```
跟渲染相关的是 AmbientVector，SHCoefficients，SkyBentNormal，DirectionalLightShadowing。

LQLightDirection 和 LQLightColor 是为低配渲染准备的，用方向+颜色近似表示probe上的间接光信息，渲染每个物体时，根据其位置在CPU端插值出间接光数据，把插值后的方向和颜色作为 uniform 传给 shader。因此低配模式下，同一个模型的每个三角形的间接光是一样的。

IndirectionTexturePosition 指定了该 Brick 的位置，为一个 Int3，表示网格的xyz index，网格的按照最精细的Brick大小为宽度，例如，`Volumetric Lightmap Detail Cell Size` 设置为200，则相邻 probe 最近距离是200，Brick包含4x4x4的probe，最小边长是800，IndirectionTexturePosition 的一个单位对应世界坐标长度是800。

最精细一级的Brick 的 IndirectionTexturePosition 为整数，再粗糙一级的IndirectionTexturePosition 是4的倍数，再往上是16的倍数，等等。

`FIrradianceVoxelImportProcessingData`类里存了辅助信息，包括bInsideGeometry，bBorderVoxel，ClosestGeometryDistance，用于导入时做处理。

### UE4 导入代码

Swam 对应 UE4 里导入数据的代码在 `Engine\Source\Editor\UnrealEd\Private\Lightmass\ImportVolumetricLightmap.cpp`，函数是`FLightmassProcessor::ImportVolumetricLightmap()`，约有600行。

函数中也会先调用 `ImportIrradianceTasks` 函数读入一个元素为结构体的二维数组，跟导出时的结构体是对应的：
``` cpp
struct FImportedVolumetricLightmapBrick
{
	FGuid IntersectingLevelGuid;
	FIntVector IndirectionTexturePosition;
	int32 TreeDepth;
	float AverageClosestGeometryDistance;
	TArray<FFloat3Packed> AmbientVector;
	TArray<FColor> SHCoefficients[6];
	TArray<FFloat3Packed> LQLightColor;
	TArray<FColor> LQLightDirection;
	TArray<FColor> SkyBentNormal;
	TArray<uint8> DirectionalLightShadowing;
	TArray<Lightmass::FIrradianceVoxelImportProcessingData> TaskVoxelImportProcessingData;
};
```

导入后续的处理的结果保存到了 MapBuildData 里的 LevelPrecomputedVolumetricLightmapBuildData 成员，所以这里不必关心导入时具体做了哪些处理也可以。

游戏启动加载 MapBuildData 的数据时会一并加载VLM，见 `UMapBuildDataRegistry::Serialize` 函数（文件为`Engine\Source\Runtime\Engine\Private\MapBuildData.cpp`），它将调用 `FArchive& operator<<(FArchive& Ar,FPrecomputedVolumetricLightmapData& Volume)`，如果要基于Build好的光照数据单独导出VLM给其他应用，可以考虑从 Level 调用`ULevel::GetOrCreateMapBuildData()`获得MapBuildData，再访问 `UMapBuildDataRegistry::GetLevelPrecomputedVolumetricLightmapBuildData`拿到`FPrecomputedVolumetricLightmapData`指针，就可以导出给外部APP使用了。

FPrecomputedVolumetricLightmapData 类的成员如下：
```
class FPrecomputedVolumetricLightmapData
{
	FBox Bounds;
	FIntVector IndirectionTextureDimensions;
	FVolumetricLightmapDataLayer IndirectionTexture;
	int32 BrickSize;
	FIntVector BrickDataDimensions;
	FVolumetricLightmapBrickData BrickData;

        //...
};
```

`Bounds` 表示其中 Bricks 覆盖的世界坐标的空间范围。

`BrickDataDimensions` 表示 BrickData 成员每个纹理占用的 Texture3D 大小（见 `Shader` 一节）。

`FVolumetricLightmapBrickData`类里包含了上述的 AmbientVector，SHCoefficients，SkyBentNormal，SkyBentNormal，DirectionalLightShadowing，LQLightColor，LQLightDirection 数据。
而原来的 IndirectionTexturePosition，TreeDepth这些数据经过导入后已经不需要保存了。

`FImportedVolumetricLightmapBrick`是每个 Brick 的原始数据，经过处理后，MapBuildData 里存的是 Map里的所有 Brick 整合在一起的数据，很难从中再提取单个 Brick 的数据。

### Shader 

VLM在shader里对应的资源定义在 `\Engine\Source\Runtime\Engine\Public\SceneView.h`，如下：
```cpp
SHADER_PARAMETER_TEXTURE(Texture3D<uint4>, VolumetricLightmapIndirectionTexture) // 3维世界坐标到线性brick数组下标映射表
SHADER_PARAMETER_TEXTURE(Texture3D, VolumetricLightmapBrickAmbientVector) // Ambient 和 SH0-5 存了 3 bands RGB，总共 3*9=27 个float
SHADER_PARAMETER_TEXTURE(Texture3D, VolumetricLightmapBrickSHCoefficients0) // Ambient 的 RGB 有效，SH0-5的RGBA有效，总共也是 6*4+3=27 个float 
SHADER_PARAMETER_TEXTURE(Texture3D, VolumetricLightmapBrickSHCoefficients1) // 
SHADER_PARAMETER_TEXTURE(Texture3D, VolumetricLightmapBrickSHCoefficients2) // 
SHADER_PARAMETER_TEXTURE(Texture3D, VolumetricLightmapBrickSHCoefficients3) // 
SHADER_PARAMETER_TEXTURE(Texture3D, VolumetricLightmapBrickSHCoefficients4) // 
SHADER_PARAMETER_TEXTURE(Texture3D, VolumetricLightmapBrickSHCoefficients5) // 
SHADER_PARAMETER_TEXTURE(Texture3D, SkyBentNormalBrickTexture)     // Sky Bent Normal
SHADER_PARAMETER_TEXTURE(Texture3D, DirectionalLightShadowingBrickTexture) // 方向光阴影
```

以上的纹理是渲染时所需的VLM的全部纹理。这些纹理需要配合一组全局 uniform 使用：
```cpp
struct ViewState {
	float3 VolumetricLightmapWorldToUVScale;
	float3 VolumetricLightmapWorldToUVAdd;
	float3 VolumetricLightmapIndirectionTextureSize;
	float VolumetricLightmapBrickSize;
	float3 VolumetricLightmapBrickTexelSize;
//...
};
```

使用这些纹理是在`Shaders\Private\VolumetricLightmapShared.ush`，比如，BasePassPixelShader.usf 等渲染物体的 shader 会调用 `ComputeVolumetricLightmapBrickTextureUVs` 函数，将像素的world坐标转成后面几个 Brick 数据纹理的坐标，后面还将间接采样VolumetricLightmapBrickSHCoefficients0 等纹理。

在 Shaders 目录下搜索这些纹理，可以查看各自的用法。简单分析一下。

- BentNormal：因为物体法线方向的半球范围内有可能被遮挡而受不到环境光，Bent Normal表示了看得到环境光的方向的平均，只要按照 bent normal 方向采样环境贴图就行了（而不是取法线方向）。
- Ambient + SHCoefficients：提供了3个频带的 SH系数，结合物体世界坐标法线方向，计算diffuse的间接光。如何从这些纹理里获得正确的SH系数，可以参考 `GetVolumetricLightmapSH3()` 函数。
- Directional Light Shadowing：作为阴影系数，直接乘在方向光上。
- IndirectionTexture：是一个3D查找表，表中的每个数字为一个（index_x, index_y, index_z，brick width）的组合，index 指向 AmbientVector、SHCoefficients等纹理的位置。像素的world坐标会换算成在查找表中的整数位置，由此查到所使用的 brick 的 index。这里的 index 是三维的，但本质上brick数据是线性排列的，每一维最多放 256 个，（理论上）最多可以有 256x256x256 个 brick，受纹理宽高长度限制，不能直接分配这么长的纹理，所以就用三维纹理存线性数组。因为不同尺度的brick存储时不加区分，所以需要结合 brick 的尺度确定其中各个 probe 的插值系数。

### Streaming

Brick 的散布范围可能很广，场景过大时可以用 streaming的方式动态加载或卸载 VLM。事实上，MapBuildData 里的 `FPrecomputedVolumetricLightmapData`指针是放在一个 Map里的，其Key 是一个GUID，表示所属的SubLevel。Swam导入的`FImportedVolumetricLightmapBrick`类的成员 `IntersectingLevelGuid` 正是描述了当前 Brick 所属的 SubLevel。

SubLevel 只包含最精细一级的 Bricks。

SubLevel的 Bricks 数据不跟 Map 的 Bricks 重复。 或者说，一个 Brick 如果属于 SubLevel，那么它就不属于 Map。

SubLevel 的 Bricks 数据也是存在 `FPrecomputedVolumetricLightmapData` 类的 `FVolumetricLightmapBrickData` 成员中。区别在于，SubLevel 没有 IndirectionTexture，因为 IndirectionTexture 描述的是整个场景的位置到 Brick的索引关系，而 SubLevel 只覆盖一小部分场景，它记录的是对全局 IndirectionTexture 的补充内容。

``` cpp
class FPrecomputedVolumetricLightmapData
{
        //...
        TResourceArray<FIntVector> SubLevelBrickPositions;
        TResourceArray<FColor> IndirectionTextureOriginalValues;
};
```
上述两个成员为 SubLevel 特有的数据（Persistent Level下这两个成员都是空的）。

`SubLevelBrickPositions` 指的是 SubLevel 里每个 Brick 在 IndirectionTexture 中的位置，被加载时，需要将 IndirectionTexture 中这些位置上的索引值换成 SubLevel 的 Brick 索引。每个元素是 byte 3 类型，假设第 i 个元素是 (px,py,pz)，则我们需要将 i 换算成新的 Brick 数据的位置 (bx, by, bz)，并把新的 Brick 挪到这个位置上，然后找到 IndirectionTexture 的 (px,py,pz) 位置，将其值换成 (bx, by, bz, 1)，这里 1 值的是 Brick 的层级。

`IndirectionTextureOriginalValues` 是卸载 SubLevel 时使用，需要将 IndirectionTexture 中被修改过的地方恢复成 IndirectionTextureOriginalValues 记录的原数据。每个元素类型是 byte 4，假设第 i 个元素是 (ox,oy,oz,ow)，我们需要访问 SubLevelBrickPositions 的第 i 个元素 (px,py,pz)，找到 IndirectionTexture 的 (px,py,pz) 位置，将其值换成 (ox, oy, oz, ow)。

为了加载和卸载 SubLevel 的 VLM 数据，UE4 运行时维护了两个全局变量：
- `FPrecomputedVolumetricLightmapData`类型的变量 `GlobalVolumetricLightmapData`，存放 IndirectionTexture，和所用到的 Bricks。这里的 Bricks 用来做 CPU 端低配数据的插值。在某些时候也会用它的GPU数据作为VLM渲染。
- `FVolumetricLightmapBrickAtlas`类型的变量 `GVolumetricLightmapBrickAtlas`，存放当前渲染用到的 bricks 数据。

当有SubLevel加载或卸载时，会动态调整上述两个变量，使得在渲染时总能正确获得所需数据。

VLM streaming的相关代码：
- `Engine\Source\Runtime\Engine\Private\PrecomputedVolumetricLightmap.cpp`的`AddToSceneData`，`RemoveFromSceneData`，`HandleDataMovementInAtlas` 函数，主要调用了compute shader，调整IndirectionTexture内容，见`Engine\Shaders\Private\VolumetricLightmapStreaming.usf`文件。如果是低配，则不调用compute shader，只修改 IndirectionTexture 的CPU部分。
- `FVolumetricLightmapBrickAtlas::Insert`，`FVolumetricLightmapBrickAtlas::Remove`函数，通过操作 GVolumetricLightmapBrickAtlas 来调整 GPU中的 brick 的数据。

渲染物体时，设置 VLM 相关 shader 资源的代码在 `Engine\Source\Runtime\Renderer\Private\SceneRendering.cpp`文件的 `SetupPrecomputedVolumetricLightmapUniformBufferParameters` 函数。
这里根据设置有可能选 GlobalVolumetricLightmapData 或 GVolumetricLightmapBrickAtlas 的 Brick 数据（纹理），但不管哪种情况，IndirectionTexture 总是在 GlobalVolumetricLightmapData 里获取的。


## 其他

### 注意事项
VLM 中的数据，包括 Indirection Texture、各种SH系数、LQLightDirecion、SkyBentNormal，凡是跟位置和方向有关的数据，均是按 UE4 的坐标系（左手系，up=z+，foward=y-，right=x+）。如果使用的地方不是这样的坐标系，需要在 shader 里做相应调整。

### 如何调试 UnrealLightmass
Lightmass 烘焙是单独的程序里运行，可能是分布式的。

UE4编辑器发起烘焙后需要连接到 Swarm，将烘焙任务发给Swarm，最终会启动 UnrealLightmass.exe，在没有启动编辑器的时候，UnrealLightmass.exe并不能获得正确的烘焙任务，所以不能直接调试UnrealLightmass。

正常启动 UE4 编辑器，console里输入 `lightmassdebug`命令，然后再点 Build Light Only，此时 Swarm 会等待UnrealLightmass.exe启动，而不是像以前那样自动启动。

然后在 Visual Studio里把启动项设成 `UnrealLightmass`（条件允许的话也可以把配置改成 Debug Program），再按 F5 启动就可以正常调试 UnrealLightmass 了。

### UE4 shader 中使用 SH 的相关代码

```cpp
FThreeBandSHVector SHBasisFunction3(half3 InputVector)
{
	FThreeBandSHVector Result;
	// These are derived from simplifying SHBasisFunction in C++
	Result.V0.x = 0.282095f; 
	Result.V0.y = -0.488603f * InputVector.y;
	Result.V0.z = 0.488603f * InputVector.z;
	Result.V0.w = -0.488603f * InputVector.x;

	half3 VectorSquared = InputVector * InputVector;
	Result.V1.x = 1.092548f * InputVector.x * InputVector.y;
	Result.V1.y = -1.092548f * InputVector.y * InputVector.z;
	Result.V1.z = 0.315392f * (3.0f * VectorSquared.z - 1.0f);
	Result.V1.w = -1.092548f * InputVector.x * InputVector.z;
	Result.V2 = 0.546274f * (VectorSquared.x - VectorSquared.y);

	return Result;
}
```

```cpp
FThreeBandSHVector CalcDiffuseTransferSH3(half3 Normal,half Exponent)
{
	FThreeBandSHVector Result = SHBasisFunction3(Normal);

	// These formula are scaling factors for each SH band that convolve a SH with the circularly symmetric function
	// max(0,cos(theta))^Exponent
	half L0 =					2 * PI / (1 + 1 * Exponent						);
	half L1 =					2 * PI / (2 + 1 * Exponent						);
	half L2 = Exponent *		2 * PI / (3 + 4 * Exponent + Exponent * Exponent);
	half L3 = (Exponent - 1) *	2 * PI / (8 + 6 * Exponent + Exponent * Exponent);

	// Multiply the coefficients in each band with the appropriate band scaling factor.
	Result.V0.x *= L0;
	Result.V0.yzw *= L1;
	Result.V1.xyzw *= L2;
	Result.V2 *= L2;

	return Result;
}
```

```cpp
half DotSH3(FThreeBandSHVector A,FThreeBandSHVector B)
{
	half Result = dot(A.V0, B.V0);
	Result += dot(A.V1, B.V1);
	Result += A.V2 * B.V2;
	return Result;
}

half3 DotSH3(FThreeBandSHVectorRGB A,FThreeBandSHVector B)
{
	half3 Result = 0;
	Result.r = DotSH3(A.R,B);
	Result.g = DotSH3(A.G,B);
	Result.b = DotSH3(A.B,B);
	return Result;
}
```

```cpp
void GetVolumetricLightmapSHCoefficients0(float3 BrickTextureUVs, out float3 AmbientVector, out float4 SHCoefficients0Red, out float4 SHCoefficients0Green, out float4 SHCoefficients0Blue)
{
	AmbientVector = GetVolumetricLightmapAmbient(BrickTextureUVs);
	SHCoefficients0Red = Texture3DSampleLevel(View.VolumetricLightmapBrickSHCoefficients0, PIVSharedSampler0, BrickTextureUVs, 0) * 2 - 1;
	SHCoefficients0Green = Texture3DSampleLevel(View.VolumetricLightmapBrickSHCoefficients2, PIVSharedSampler2, BrickTextureUVs, 0) * 2 - 1;
	SHCoefficients0Blue = Texture3DSampleLevel(View.VolumetricLightmapBrickSHCoefficients4, PIVSharedSampler4, BrickTextureUVs, 0) * 2 - 1;

	// Undo normalization done in FIrradianceBrickData::SetFromVolumeLightingSample
	float4 SHDenormalizationScales0 = float4(
		0.488603f / 0.282095f, 
		0.488603f / 0.282095f, 
		0.488603f / 0.282095f, 
		1.092548f / 0.282095f);

	SHCoefficients0Red = SHCoefficients0Red * AmbientVector.x * SHDenormalizationScales0;
	SHCoefficients0Green = SHCoefficients0Green * AmbientVector.y * SHDenormalizationScales0;
	SHCoefficients0Blue = SHCoefficients0Blue * AmbientVector.z * SHDenormalizationScales0;
}

FThreeBandSHVectorRGB GetVolumetricLightmapSH3(float3 BrickTextureUVs)
{
	float3 AmbientVector;
	float4 SHCoefficients0Red;
	float4 SHCoefficients0Green;
	float4 SHCoefficients0Blue;
	GetVolumetricLightmapSHCoefficients0(BrickTextureUVs, AmbientVector, SHCoefficients0Red, SHCoefficients0Green, SHCoefficients0Blue);

	float4 SHCoefficients1Red = Texture3DSampleLevel(View.VolumetricLightmapBrickSHCoefficients1, PIVSharedSampler1, BrickTextureUVs, 0) * 2 - 1;
	float4 SHCoefficients1Green = Texture3DSampleLevel(View.VolumetricLightmapBrickSHCoefficients3, PIVSharedSampler3, BrickTextureUVs, 0) * 2 - 1;
	float4 SHCoefficients1Blue = Texture3DSampleLevel(View.VolumetricLightmapBrickSHCoefficients5, PIVSharedSampler5, BrickTextureUVs, 0) * 2 - 1;

	float4 SHDenormalizationScales1 = float4(
		1.092548f / 0.282095f,
		4.0f * 0.315392f / 0.282095f,
		1.092548f / 0.282095f,
		2.0f * 0.546274f / 0.282095f);

	SHCoefficients1Red = SHCoefficients1Red * AmbientVector.x * SHDenormalizationScales1;
	SHCoefficients1Green = SHCoefficients1Green * AmbientVector.y * SHDenormalizationScales1;
	SHCoefficients1Blue = SHCoefficients1Blue * AmbientVector.z * SHDenormalizationScales1;

	FThreeBandSHVectorRGB IrradianceSH;
	// Construct the SH environment
	IrradianceSH.R.V0 = float4(AmbientVector.x, SHCoefficients0Red.xyz);
	IrradianceSH.R.V1 = float4(SHCoefficients0Red.w, SHCoefficients1Red.xyz);
	IrradianceSH.R.V2 = SHCoefficients1Red.w;

	IrradianceSH.G.V0 = float4(AmbientVector.y, SHCoefficients0Green.xyz);
	IrradianceSH.G.V1 = float4(SHCoefficients0Green.w, SHCoefficients1Green.xyz);
	IrradianceSH.G.V2 = SHCoefficients1Green.w;

	IrradianceSH.B.V0 = float4(AmbientVector.z, SHCoefficients0Blue.xyz);
	IrradianceSH.B.V1 = float4(SHCoefficients0Blue.w, SHCoefficients1Blue.xyz);
	IrradianceSH.B.V2 = SHCoefficients1Blue.w;

	return IrradianceSH;
}
```

