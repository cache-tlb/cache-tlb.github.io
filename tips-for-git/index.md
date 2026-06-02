# Git 使用技巧


### 如何迁移 git 仓库

本地有一个仓库 A，想放在远端变成仓库 B，同时 B 还要保留 A 的提交记录。方法如下：

先新建远端的 B 仓库，什么也不要有，readme，license，gitignore都不能有，假设 B 的地址为：https://github.com/XXX/yyy.git

进入 A 仓库的根目录，执行：

`git push https://github.com/XXX/yyy.git --all`

就可以了，后续还可以push tags：

`git push https://github.com/XXX/yyy.git --tags`

若使用 tortoise git，可以A仓库目录下右键选 git sync ...，remote 那里点 manage，填写远程仓库地址等，save 后， remote URL选刚刚填的地址，再 push就行了。

参考：
- https://www.cnblogs.com/fei8899/p/14347049.html


### 如何永久删除大文件

用 git-bash.exe 可以在 Windows 上执行下面简单的 Linux 命令，如 sort，grep。

1. 首先要找到大文件：

`git verify-pack -v .git/objects/pack/pack-*.idx | sort -k 3 -g`

这一步将所有文件都列出来，并按从小到大排序，得到的结果每一行是一个 hash。

2. 为了获得 hash 对应的文件名，用命令：

`git rev-list --objects --all` 

3. 找到文件之后，用类似如下的命令从所有分支里删除它，例如下面是删掉 BigFile.txt BigFile2.txt 文件。

`git filter-branch --force --prune-empty --index-filter 'git rm -rf --cached --ignore-unmatch BigFile.txt BigFile2.txt' --tag-name-filter cat -- --all`

也可以删除目录，多个文件或目录之间用空格分开。如果git的分支或者提交较多，建议一次性删除多个文件，因为每次删除都要遍历所有分支覆写提交记录，分支和提交多了覆写就很耗时间，一次性删除多个文件也只会覆写一次。

4. 等该删除的文件都删除了，然后，删除缓存的对象。依次三个命令：

```bash
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now
```

这个时候，本地的 .git 目录就变小了。

5. 最后push，如果远端有多个分支，需要手动强制 push 所有分支：

`git push --force --all`

push all 只会将本地存在的分支上传，如果某个远端的分支在本地没有，则需要先在本地 checkout，否则不会改变远端的分支。

<br/>

备注：

如果有一个文件在当前分支没有，如何找到它在哪个分支呢？

先查找文件的所有提交记录：

```bash
git log --all --oneline --follow -- <文件路径>  # 跟踪文件重命名
git log --all --oneline -- '**/<文件名>'       # 模糊搜索（适用于忘记完整路径）
```

这一步会输出commit id，然后根据commit id 找到分支：

```bash
git branch -a --contains <commit ID>  # -a 表示包括所有本地和远程分支
```

参考：
- https://www.jianshu.com/p/4f2ccb48da77
- https://www.jianshu.com/p/7231b509c279

