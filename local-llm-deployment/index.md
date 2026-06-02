# 本地大模型部署


### 方案综述

推理框架采用 [llama.cpp](https://github.com/ggml-org/llama.cpp/)，模型采用千问`Qwen3.5-35B-A3B`，量化为4bit。如此只需要8G显存或20G内存即可运行一个效果还不错的LLM，完全可以跑在笔记本或家用台式机上。如需降低配置可以考虑千问小模型系列。

### 安装步骤

1. 下载推理框架：可在llama.cpp的[release页面](https://github.com/ggml-org/llama.cpp/releases)下载预编译版本。如果要使用Windows CUDA版本，需要额外安装对应的CUDA运行时DLL。
2. 下载模型：[\[hugging face链接\]](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF/resolve/main/Qwen3.5-35B-A3B-Q4_K_M.gguf?download=true) | [\[modelscape 链接\]](https://modelscope.cn/models/unsloth/Qwen3.5-35B-A3B-GGUF/resolve/master/Qwen3.5-35B-A3B-Q4_K_M.gguf) . 这个版本模型需要8G显存。

### 运行

1. 启动服务器：`-m` 后面接上模型实际的保存路径。
``` bash
llama-server -m Qwen3.5-35B-A3B-Q4_K_M.gguf
``` 

2. 打开 WebUI：浏览器访问 [http://localhost:8080/](http://localhost:8080/) 即可。

3. 某些应用支持用 OpenAI 风格的 API 接口调用，在 custom API interface address 一类的地方填上 `http://localhost:8080/v1/chat/completions` 来替换 OpenAI 官方链接。

### 其他配置

- CPU版本：命令行需要加上`-n 8` 选项，表示用8线程运行；还要加上 `-ngl 0` 选项，表示0层参数存在显存上。CPU版本占用内存约为20GB。
- context size：默认的context大小很小，可以使用 `-c` 参数设置，例如 `-c 65536` 就是65k的上下文。
- 非思考模式：增加命令行选项 `--chat-template-kwargs '{"enable_thinking":false}'` ，如果Windows平台下提示解析参数失败，尝试在每个双引号前加上反斜杠转义符。
- 改端口号：由`--port`设置，例如 `--port 8001`

### [进阶] 本地AI coding

- 下载模型。虽然 Qwen3.5-35B-A3B 也能执行一些编码任务，但针对正式项目推荐用专门的coding模型，例如 Qwen3-Coder-Next: [\[hugging face\]](https://huggingface.co/unsloth/Qwen3-Coder-Next-GGUF/resolve/main/Qwen3-Coder-Next-UD-Q4_K_XL.gguf?download=true) | [\[model scape\]](https://modelscope.cn/models/unsloth/Qwen3-Coder-Next-GGUF/resolve/master/Qwen3-Coder-Next-UD-Q4_K_XL.gguf)

- 启动服务器。

``` bash
./llama.cpp/llama-server \
    --model unsloth/Qwen3-Coder-Next-GGUF/Qwen3-Coder-Next-UD-Q4_K_XL.gguf \
    --alias "unsloth/Qwen3-Coder-Next" \
    --seed 3407 \
    --temp 1.0 \
    --top-p 0.95 \
    --min-p 0.01 \
    --top-k 40 \
    --port 8001 \
```

- 配置 Claude code。参考 [unsloth 文档](https://unsloth.ai/docs/zh/ji-chu-zhi-shi/claude-code)，注意需要设置跳过登录，然后替换anthropic base url为localhost。例如在 powershell 下应执行如下指令：`setx ANTHROPIC_BASE_URL "http://localhost:8001"`

启动 Claude code时，带上使用的模型名字，即（llama-server 命令行参数 -a 后面的名字），就可以用本地模型生成代码了。

``` bash
claude --model unsloth/Qwen3-Coder-Next
```

- 测试
在 Claude code TUI 直接输入： `write a sudoku solver in HTML`. 等待片刻就会生成如下代码：[sudoku.html](./sudoku.html)

### 参考

安装方法转载自[TK的微博](https://m.weibo.cn/status/5276790383706982)
