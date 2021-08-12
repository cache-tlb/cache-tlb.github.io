# GameBoy 模拟器开发记录


## 前言

如果问一个模拟器的作者为什么要编写模拟器，不同人的回答可能不尽相同。就比如你问一个 MineCraft 玩家为什么要在游戏里造一个 CPU，有的人会说，想给自己和大家展示 CPU 的工作原理；也有人会说，造一个 CPU 出来很酷不是吗；当然还有人会直接说，因为我能！

一个现实的问题是，随着厂家停止生产过时的游戏机，这些古董终有一天也会只在博物馆里才能见到，而曾经在上面运行的游戏也会烟消云散。
也只有模拟器能让以后的人们能看到这些历史上的游戏是什么样子的。

相信很多人在初学编程后都对编写一个 GameBoy 或 NES 模拟器念念不忘。不管是在 Google 还是 Github 上都可以搜到大量的模拟器实现代码和博文。各种语言的都有，比如 C++、Go、Python、JavaScript 等等。 

本人无意于重复造轮子。 
GameBoy 作为最简单的游戏主机/掌机之一，麻雀虽小，却也五脏俱全。借由对 GameBoy 运行流程的分析，可一瞥早期游戏机乃至计算机的工作原理，也可以看到在硬件机能严重受限的条件下的游戏都是如何设计出来的。

### 参考资料
- [no$gmb](https://github.com/zanders3/gb/tree/master/no%24gmb)：完美而经典的 GameBoy 模拟器实现，可单步调试。
- [pandocs.txt](https://bgb.bircd.org/pandocs.txt)：no$gmb 作者 Martin Korth 整理的文档。
- [GameBoy CPU Manual](https://realboyemulator.files.wordpress.com/2013/01/gbcpuman.pdf)：任天堂官方公布的 GameBoy 文档。
- [GameBoy Opcode Summary](http://gameboy.mongenel.com/dmg/opcodes.html)：CPU 操作码总结。

## 术语

### 机型缩写

| 缩写 | 全称 |
|------|------|
| GB | GameBoy |
| GBP | GameBoy Pocket |
| GBC / CGB |  GameBoy Color |
| SGB | Super GameBoy |

### 硬件

MBC - Memory Bank Controller

ROM - Read Only Memory

RAM = Random Access Memory

OAM - Object Attribute Memory

### 寄存器
|简称|全称|地址|
|---|---|---|
| LCDC | LCD Control Register | $FF40 |
| STAT | LCD Status Rigister | $FF41 |
| SCY  |  Scroll Y | $FF42 |
| SCX  | Scroll X  | $FF43 |
| LY   | LCD Y坐标 | $FF44 |
| LYC  | LY Compare | $FF45 |
| WY   | Window Y Position | $FF4A |
| WX   | Window X Position minus 7 | $FF4B |
| DMA  | Direct Memory Access | $FF46 |
| BGP  | Background Palette | $FF47 |
| OBP  | Object Palette | $FF48 - FF49 |
| IF   | Interrupt Flags | $FF0F |
| IE   | Interrupt Enable | $FFFF |

## 技术参数
|指标 | 内容 |
|------|------|
| CPU | 8-bit (Similar to the Z80 processor) |
| Clock Speed  | 4.194304MHz (4.295454MHz for SGB, max. 8.4MHz for CGB) |
| Work RAM     | 8K Byte (32K Byte for CGB) |
| Video RAM    | 8K Byte (16K Byte for CGB) |
| Screen Size  | 2.6" |
| Resolution   | 160x144 (20x18 tiles) |
| Max sprites  | Max 40 per screen, 10 per line |
| Sprite sizes | 8x8 or 8x16 |
| Palettes     | 1x4 BG, 2x3 OBJ (for CGB: 8x4 BG, 8x3 OBJ) |
| Colors       | 4 grayshades (32768 colors for CGB) |
| Horiz Sync   | 9198 KHz (9420 KHz for SGB) |
| Vert Sync    | 59.73 Hz (61.17 Hz for SGB) |
| Sound        | 4 channels with stereo sound |
| Power        | DC6V 0.7W (DC3V 0.7W for GB Pocket, DC3V 0.6W for CGB) |

## 地址映射

GameBoy 地址线是 16 位，用于表示 ROM，RAM，I/O 寄存器寻址。

| 地址段 | 作用 |
|------|------|
| 0000-3FFF |  16KB ROM Bank 00     (in cartridge, fixed at bank 00) |
| 4000-7FFF |  16KB ROM Bank 01..NN (in cartridge, switchable bank number) |
| 8000-9FFF |  8KB Video RAM (VRAM) (switchable bank 0-1 in CGB Mode) |
| A000-BFFF |  8KB External RAM     (in cartridge, switchable bank, if any) |
| C000-CFFF |  4KB Work RAM Bank 0 (WRAM) |
| D000-DFFF |  4KB Work RAM Bank 1 (WRAM)  (switchable bank 1-7 in CGB Mode) |
| E000-FDFF |  Same as C000-DDFF (ECHO)    (typically not used) |
| FE00-FE9F |  Sprite Attribute Table (OAM) |
| FEA0-FEFF |  Not Usable |
| FF00-FF7F |  I/O Ports |
| FF80-FFFE |  High RAM (HRAM) |
| FFFF      |  Interrupt Enable Register |

使用最多的是 ROM 和 RAM，
ROM位于卡带上，分配给 ROM 的地址空间只有 16 KB + 16 KB，
但卡带的 ROM 可能超过 32 KB，比如 Super Mario Land 的 ROM 就有 64 KB，事实上，GameBoy支持最大 2 MB 的 ROM。
为了能访问到所有的 ROM 内容，我们将 ROM 划分成一个个 16 KB 的块，称为 bank。
00 号 bank 占有第一个 16 KB 地址空间（0000-3FFF），
而第二个 16 KB 的空间（4000-7FFF）可以根据需要映射至不同的 bank，这个映射由 MBC（Memory Bank Controller 控制）。

可想而知，00 号 bank 应该被用来存通用的游戏内容，比如角色相关、控制相关的代码。其他 bank 存的内容则是会随着游戏进行而动态加载和卸载的，比如关卡相关的数据。

E000-FDFF 为 C000-DDFF 的镜像地址，读写前者的效果与读写后者的效果完全一样。

#### 第一个 ROM Bank 中的跳转向量

约定俗成的重要函数入口一般写在下面的地址里：

对于 RST 指令：0000, 0008, 0010, 0018, 0020, 0028, 0030, 0038

对于中断处理：0040, 0048, 0050, 0058, 0060

当然，如果程序中没有使用 RST 或某些中断就可以不管，拿这些地址用作别的用途。

#### 卡带头
0100-014F 中为卡带头数据，内容包括程序信息、入口、校验和、MBC芯片信息、ROM 和 RAM 大小，等等。

#### 外部硬件
A000-BFFF 可用于外接内存的寻址，比如，存储游戏状态、高分表，等等，它需要电池额外供电。
外接内存也是在卡带上，可能很大，类似的也要分成一个个 **8 KB** 的 bank，由 MBC 控制当前将哪个外部 RAM 的 bank 映射到 A000-BFFF。

## MBC 类型
MBC (Memory Bank Controllers) 位于卡带上，而不是 GB 游戏机上。MBC 有多种类型，卡带头的数据里带有 MBC 类型（位于 0147）。包含下面几类：
- None (32KByte ROM only)
- MBC1 (max 2MByte ROM and/or 32KByte RAM)
- MBC2 (max 256KByte ROM and 512x4 bits RAM)
- MBC3 (max 2MByte ROM and/or 32KByte RAM and Timer)
- HuC1 (MBC with Infrared Controller)

### None
仅使用 32 KB ROM，占用 0000-7FFF 地址空间；可能带有最多 8 KB 的额外 RAM，占用 A000-BFFF。

### MBC1
这是 GB 使用的最初代 MBC 芯片。MBC1 有两种模式，一种支持最大 2M Byte ROM 和 8K Byte RAM，另一种支持最大 512K Byte ROM 和 32K Byte RAM。前者称为 ROM banking 模式，后者称为 RAM banking 模式。

- 0000-3FFF：ROM Bank 00，总是包含卡带开头的 16 KB 数据。
- 4000-7FFF：ROM Bank 01-7F。2MB 的 ROM 可以被分成 128 个 bank，这样 ROM bank的编号从 00 到 7F 就足够了。但是 20，40，60 这 3 个编号的 bank 其实读不到，所以实际可用的总 bank 数只有 125 个。
- A000-BFFF：RAM Bank 00-03，如果有的话。不同卡带上附带的 RAM 可能有 2K Byte（占用 A000-A7FF）、8K Byte（占用A000-BFFF）或者 32K Byte（4个 8 KB 的 bank）。

一般来说，0000-7FFF 的地址空间是 ROM，它是只读的。往这上面写数据并不会改变 ROM 的内容。
GB 把往这个地址段上的写指令处理为向 MBC 寄存器写数据。往不同地址段的写会有不同的含义。
- 0000-1FFF： RAM Enable，一般来说，往这个地址段写 00h 表示关闭外部 RAM，写 0Ah 表示打开。但其实只要写任何低四位是 0Ah 的数都是打开外部 RAM，其他则是关闭。只有打开了外部 RAM，这部分内存才能在运行中被读写。（Super Smart Card 不需要指令打开，它总是开的）
- 2000-3FFF： Lower 5 Bits of ROM Bank Number。取写入值的最低5位。如果是选择 2MB ROM / 8KB RAM 模式，则刚好可以表示 32 个 ROM bank 编号（00-1F）。特别的，如果写的是00，GB会认为写的是 01。
- 4000-5FFF： Upper 2 Bits of ROM Bank Number。取写入值的最高2位。如果选用了 512KB ROM / 32KB RAM 模式，则这个值用来表示 RAM bank 编号。如果选用了 2MB ROM / 8KB RAM 模式，则这2个bits用作 ROM bank 编号的最高两位。 但由于编号最低 5 bits 若是 00 则一定会视为 01，对 20、40、60 的访问变成了 21、41、61。所以这 3 个 bank 其实是不可能被读到。
- 6000-7FFF：ROM/RAM 模式切换。最低位写 0 表示 ROM Banking 模式，这是开机后的默认模式。最低为 1 表示 RAM Banking 模式。这两个模式之间可以自由切换。也就是一个卡带可以既有 2MB ROM，又有 32 KB 外部 RAM。只不过在 RAM banking 模式下，只有 00-1Fh 号的 ROM bank 可用，在 ROM banking模式下，只有 00 号的 RAM bank 能用。

### MBC2
MBC2支持最大 256 KB ROM 和 512x4 bits RAM，它和 MBC1 很多地方是一样的。下面列出不同的部分。
- 读 4000-7FFF：对应 ROM Bank 01-0F，只有 16 个bank 可用。
- A000-A1FF：对应 256 Byte RAM。**因为这部分 RAM 是由 512 个 4 bit组成的，所以每个地址只有最低4位有效**。这也是为什么256 Byte RAM 会占用 512 的地址空间。
- 写 0000-1FFF：RAM Enable，不是所有的地址都有效。The least significant bit of the upper address byte must be zero to enable/disable cart RAM. 有点绕，就是说当写的地址的较高位byte的最低位是0，才能开关 RAM 读写，例如这些地址段：0000-00FF, 0200-02FF, 0400-04FF, ..., 1E00-1EFF. 其他往地址段写不会起任何作用。推荐使用 0000-00FF 地址段。
- 2000-3FFF：ROM Bank Number。(XXXXBBBB - X = Don't cares, B = bank select bits)。设置 ROM bank 编号。不是所有的地址都有效。The least significant bit of the upper address byte must be one to select a ROM bank. 当写的地址的较高位byte的最低位是1才能设置成功，比如 2100-21FF, 2300-23FF, 2500-25FF, ..., 3F00-3FFF. 推荐用 2100-21FF 地址段。

### MBC3
MBC3 在 MBC1基础上多了一个时钟 Real Time Clock (RTC)。下面列出与 MBC1 不同的部分。
- 读 4000-7FFF 时，20、40、60号 ROM bank 可以正确被读到。
- A000-BFFF 既可以被用作 RAM bank 00-03 的地址，也可以用来读写 RTC 的4个寄存器。
- 0000-1FFF 跟 MBC1 功能一样，再额外加上可以开关 RTC 寄存器读写。通过写 0Ah / 00h 来开和关。
- 2000-3FFF ROM bank number。写入值的低7位表示 ROM bank 编号。00依然被当作01。
- 4000-5FFF RAM Bank Number / RTC Register Select。若写入值是 00-03，则 A000-BFFF 地址段被映射成外部 RAM 相应的 bank；若写入值是 08h-0Ch，则读写 A000-BFFF 相当于读写 RTC 寄存器（通常用地址 A000 读写）。详见下表。
- 6000-7FFF Latch Clock Data。往这个地址先写 00h，再写一个 01h，可以开关时间锁。锁关上的期间下， RTC中读到的值不会变化。直到锁打开。因为要读出完整的时间需要很多指令，读时间的过程中这些寄存器很容易改变值，因此需要锁住。锁住的时候后台的时间仍然在跑，只不过读出来的是锁住时的时间。解锁之后会变成正常的时间。

##### RTC 寄存器
当 4000-5FFF 写入 08h-0Ch 各个值时，读写 A000-BFFF 等价于读写 RTC 寄存器，具体为 
| 写入值 | 寄存器 | 含义 | 说明 |
|-------|-------|-------|-------|
|  08h  | RTC S |  Seconds |  0-59 (0-3Bh) |
|  09h  | RTC M |  Minutes |  0-59 (0-3Bh) |
|  0Ah  | RTC H |  Hours   |  0-23 (0-17h) |
|  0Bh  | RTC DL |  Days   |  Lower 8 bits of Day Counter (0-FFh) |
|  0Ch  | RTC DH | 见下面 |   |
|       | RTC DH.0 | Days | Bit 8 |
|       | RTC DH.6 | Halt | 0=Active, 1=Stop Timer，默认状态是 1 |
|       | RTC DH.7 | Day Counter Carry Bit | 1=Counter Overflow |

##### The Day Counter
用来表示天数的寄存器有 9 bit，可以表示 0-511 天，然后 RTC DH.7 就会记录到溢出，除非在 runtime 清掉溢出位。一种做法是每次进游戏都把天数读出来，存到外部 RAM 里，作为 offset；RTC里的天数清零。这样，只要每 511 天进一次游戏，就能保证时间正确。

##### 访问 RTC 的频率
推荐相邻两次访问 RTC 寄存器的时间间隔不低于 4 毫秒。

### HuC1
跟 MBC1 一样，只不过带有红外 LED 输入输出设备。

### Gamegenie/Shark Cheats
Game Shark 和 Gamegenie 类似转接头，用于作弊或打补丁。

Gamegenie 是 ROM 补丁，做法是先记录要打补丁的 ROM 地址和新旧数据，如果一个 read 指令地址对上了，读到 ROM 上的数据也跟记录的旧数据一样，那么就将记录里的新数据传给 GB。 

Game Shark 是 RAM 补丁，猜测是在 VBlank 的时候扫 RAM，修改值。

## 手柄输入
手柄共有 8 个按键：上、下、左、右、A、B、Start、Select。

通过读写 FF00h 获得手柄状态。该地址的 bit 0-5 有效，bit 0-3 只读，一次性返回 4 个按键的状态；bit 4-5 只写，如果仅有 bit 4 被激活，那么返回上下左右的状态。

|         | bit 4 |      bit 5 |
|:-:|:-:|:-:|
|bit 0    |  right|        A   |
|bit 1    |  left |        B   |
|bit 2    |   up  |      select |
|bit 3    |  down |      start |

注意：这里的激活指的是设置低电平（0），返回的状态也是 0 表示按下，1 表示没按。返回的 Byte 只有最低 4 位有效。因此需要读两次才能获得全部按键状态。

下面是一个读取手柄状态的样例。

```asm
        Game: Ms. Pacman
        Address: $3b1
LD  A, $20      ; bit 5 = $20
LD  ($FF00), A  ; select P14 by setting it low
LD  A, ($FF00)
LD  A, ($FF00)  ; wait a few cycles
CPL             ; complement A
AND $0F         ; get only first 4 bits
SWAP A          ; swap it
LD  B, A        ; store A in B
LD  A, $10
LD  ($FF00), A  ; select P15 by setting it ow
LD  A, ($FF00)
LD  A, ($FF00)
LD  A, ($FF00)
LD  A, ($FF00)
LD  A, ($FF00)
LD  A, ($FF00)  ; Wait a few MORE cycles
CPL             ; complement (invert)
AND $0F         ; get first 4 bits
OR  B           ; put A and B together
LD  B, A        ; store A in B
LD  A, ($FF8B)  ; read old joy data from ram
XOR B           ; toggle w/ current button bit
AND B           ; get current button bit back
LD  ($FF8C), A  ; save in new Joydata storage
LD  A, B        ; put original value in A
LD  ($FF8B), A  ; store it as old joy data
LD  A, $30      ; deselect P14 and P15
LD  ($FF00), A  ; RESET Joypad
RET             ; Return from Subroutine
```

## 中断
同 PC 的体系结构一样，GB 的 CPU 在执行完一条指令后也会检查是否有中断触发，如果有则会跳转至中断处理程序的入口。
GB 共有 5 种中断类型，分别是：
| 类型 | 优先级 | 说明 | 地址 | 
|------|:----:|------|:------:|
| V-Blank | 1 | V-Blank 周期 | 0x0040 |
| LCDC status | 2 | LYC == LY 的时候 | 0x0048 |
| Timer Overflow | 3 | TMA 溢出 | 0x0050 |
| Serial Transfer | 4 | 串口传输结束 | 0x0058 |
| Hi-Lo of P10-P13 | 5 | 手柄输入 | 0x0060 |

寄存器 IF 记录当前有哪些中断被触发，IE 记录有哪些中断允许执行。

此外，还有一个 IME flag 作为所有中断的总开关。IME 无法通过写内存的方式改变值，只能通过 EI 和 DI 指令开关。

当中断产生时，IF 的相应 bit 会被设为 1，如果 IME 和 IE 对应的 bit 都是 1，则会执行下面 3 个步骤：

1. IME 被设为 0，以避免中断的嵌套；
2. PC 压栈；
3. 跳转到对应的中断处理函数起始地址。

当然，也可以在中断处理程序里通过 CPU 指令打开 IME，就允许了中断的嵌套。中断返回可以用 RET 或 RETI 指令，区别在于 RETI 会打开 IME，而 RET 不会。 RETI 相当于 EI + RET 两个指令。

如果同时有多个中断被触发，则会按照优先级顺序依次处理，V-Blank优先级最高，手柄输入最低。

## 显示

### 一些概念

##### Background
GB 的背景（background，或者称为screen buffer） 包含 256x256 像素（32x32个tile，每个tile占8x8），其中的 160x144 的像素会被显示出来，SCX和SCY记录了屏幕左上角在背景上的坐标。背景的边界类似于OpenGL纹理的 wrap 采样模式。

显存的其中一块区域用来存 background 的 32x32 个tile的id（每个id是1一个Byte），称为 `Background Tile Map`，位于 9800h-9BFFh 或 9C00h-9FFFh，共 1024 Byte，取决于 LCDC 的设置。tile的具体内容存在 Tile Data Table中，对应地址为 8000h-8FFFh 或者 8800h-97FFh，占用 4096 Byte，存了 256 个 Tile，每个 Tile 占 16 Byte，可通过 LCDC 寄存器的设置选择在哪一段内。对于第一种情况，tile id被当作无符号数，从0到255，比如0号tile在地址8000；第二种情况，tile id 是有符号数，从-128到127，0号tile在地址9000。

在 CGB 模式下，有一个额外的 32x32 的 Byte 存在 VRAM bank 1，存了每个 background tile map 额外的信息。
- Bit 0-2  Background Palette number  (BGP0-7)
- Bit 3    Tile VRAM Bank number      (0=Bank 0, 1=Bank 1)
- Bit 4    Not used
- Bit 5    Horizontal Flip            (0=Normal, 1=Mirror horizontally)
- Bit 6    Vertical Flip              (0=Normal, 1=Mirror vertically)
- Bit 7    BG-to-OAM Priority         (0=Use OAM priority bit, 1=BG Priority)
如果这里的 bit 7 设为 1，那么对应的 background tile 的优先级比所有的 sprite 都高，不管 sprite 的 OAM 设了怎样的优先级。但还有一个优先级的总开关在 LCDC 的 bit 0，可以屏蔽 background tile的优先级。

##### Window
背景以外，还有窗口（window）的概念。窗口覆盖在背景之上，不可滚动（即窗口大小不超过一屏幕）。窗口的左上角在屏幕上的位置由WX和WY寄存器指定。用于画 window 的 tile 也存在 Tile Data Table 里。

If the window is used and a scan line interrupt disables it (either by writing to LCDC or by setting WX > 166) and a scan line interrupt a little later on enables it then the window will resume appearing on the screen at the exact position of the window where it left off earlier. This way, even if there are only 16 lines of useful graphics in the window, you could display the first 8 lines at the top of the screen and the next 8 lines at the bottom if you wanted to do so.

WX may be changed during a scan line interrupt (to either cause a graphic distortion effect or to disable the window ( WX>166) ) but changes to WY are not dynamic and won't be noticed until the next screen redraw.

##### Tile
Tile Data Table中存了一个个 8x8 的tile，每个像素占2 bit，所以一个 tile 占 16 Byte。
这16个byte每两个分成一组，编码一行的8个像素。Byte 0-1 表示第一行，Byte 2-3 表示第二行，等等。一组的两个byte中，第一个表示每个像素的低位（least significant bits），第二个表示每个像素的高位（upper bits）。每个 Byte 中，bit 7 表示最左侧像素，bit 0 表示最右侧像素。
如下面的例子，是一个8x8的像素的 tile：
``` txt
. 3 3 3 3 3 . .
2 2 . . . 2 2 .
1 1 . . . 1 1 .
2 2 2 2 2 2 2 .
3 3 . . . 3 3 .
2 2 . . . 2 2 .
1 1 . . . 1 1 .
. . . . . . . .
```
编码过程如下：
``` txt
. 3 3 3 3 3 . .  ->  01111100  ->  7C
                     01111100  ->  7C
2 2 . . . 2 2 .  ->  00000000  ->  00
                     11000110  ->  C6
1 1 . . . 1 1 .  ->  11000110  ->  C6
                     00000000  ->  00
2 2 2 2 2 2 2 .  ->  00000000  ->  00
                     11111110  ->  FE
3 3 . . . 3 3 .  ->  11000110  ->  C6
                     11000110  ->  C6
2 2 . . . 2 2 .  ->  00000000  ->  00
                     11000110  ->  C6
1 1 . . . 1 1 .  ->  11000110  ->  C6
                     00000000  ->  00
. . . . . . . .  ->  00000000  ->  00
                     00000000  ->  00
```
于是，这个 tile 在 ROM 中存的数据（从低地址到高地址）就是 7C 7C 00 C6 C6 00 00 FE C6 C6 00 C6 C6 00 00 00 。

每个像素存的 0-3 的值会经过 palettes 转化成真正的颜色（或灰度）。调色板对应的寄存器位于 FF47-FF49 (Non CGB Mode) 或者 FF68-FF6B (CGB Mode)。

##### Sprite
sprite表示前景，一般是角色、怪物等可移动的物体。GB 可以显示最多 40 个 sprite，每行可最多显示 10 个。sprite 大小可以是 8x8 或 8x16。Sprite 的图像和 tile 类似，只是 sprite 只在 8000-8FFF（共 4096 Byte）。
每个要画的 sprite id (0-255) 存在 OAM 中。OAM 地址范围是 FE00-FE9F，被分成 40 个 4 Byte 的块，每块存 id 用 一个 Byte，存位置用 2 个 Byte，剩下的 Byte 存一些其他属性。每个 Byte 含义如下：
- Byte 0：sprite 左上角在屏幕的 y 坐标
- Byte 1：sprite 左上角在屏幕的 x 坐标
- Byte 2：tile id（0-255），如果 sprite 是 8x16，最低位会被视为 0。
- Byte 3：一些flag。具体如下：
- 3_7：优先级。如果设为 0，sprite 会画在 background 和 window 之上；如果设为 1，则 sprite 会被颜色为 1-3 的 background 或 window 遮挡。如果 background 或 window 的颜色是 0，则无论哪种情况都是 sprite 在上面。
- 3_6：y flip，如果被设为 1，则按 y 轴镜像
- 3_5：x flip，如果被设为 1，则按 x 轴镜像
- 3_4：palette number。调色板有两个可以选，如果设为 0 则选用 OBJ0PAL，设为 1 则选用 OBJ1PAL。仅在非 CGB 模式下有效。
- 3_3：Tile VRAM-Bank。仅在 CGB 模式下有效。
- 3_2-0：Palette number，仅在 CGB 模式下有效，表示调色板编号（0-7）

sprite 只有 3 种颜色，颜色 0 表示透明。

若 sprite 是 8x16 模式，则一个 sprite 占用了两个 tile，此时 tile id 的最低位不生效。

如果有相同坐标的 sprite 在屏幕上有重叠，则 x 较小的有较高优先级，在上面；如果 x 一样，则根据 OAM 的地址（而不是 sprite id）的高低确定优先级，地址越小优先级越高，比如 FE00 拥有最高优先级，FE04 其次，在最上面。

CGB 模式下，重叠的 sprite 不比较 x 坐标，直接根据 OAM 地址确定优先级。

位于 x=0, y=0 的 sprite 其实不会在屏幕上显示出来，需要将 x 减去 8，且 y 减去 16，才是 sprite 左上角在屏幕上的坐标。因此，要把 sprite 画在左上角，需要设置 x = 8，y = 16。

每一行最多只能画 10 个 sprite，如果超过这个限制，低优先级的不会被画出来。如果想要不用的 sprite 隐藏起来，只要设置它们的 y = 0 或 y >= 144 + 16。如果仅仅将 x 设为 0 或 x >= 160 + 8，虽然屏幕上看不见，但是占了对应行的一个名额。

##### 如何写 OAM 
推荐的方法是先将数据写到 RAM 里，再用 DMA 将 RAM 数据拷到 OAM。但也可以直接通过 LD 指令将数据写到 OAM 对应的内存，但只能在 H-Blank 和 V-Blank 期间有效。 H-Blank 和 V-Blank 可以读 STAT 寄存器得到。

注意：当 LCD Controller 在画屏幕时，它会占有 VRAM 和 OAM 的访问权限，在此期间 CPU 无法读写 VRAM 和 OAM，写操作不会产生效果，读操作返回的数不保证是多少（通常是 0xFF）。因此，在读或写 VRAM 以及 OAM 之前需要验证是否可读写，只需要读 STAT 寄存器的最低两位（Mode Bits）就行。 

Mode Bits 为 0 或 1 时会紧接着的状态是 2，所以一般会判断 Mode Bits 为 0 或 1 时访问 VRAM。因为即使是状态 0 或 1 的结尾，也仍然有几个周期是状态 2， VRAM 此时仍然可以访问的。同理，也必须保证读 Mode Bits 和实际访问 VRAM 之间不能被打断。

对于 OAM，只有状态 0 和 1 是可访问的，所以通常的做法是先等待状态为非 0 或 1，再等待状态为 0 或 1，这样可以保证在状态 0 或 1 开始的时候访问。OAM 也可以通过 DMA 的方式访问，多数情况下推荐使用 DMA 的方式访问。

当显示关闭的时候，VRAM 和 OAM 在任何时候都是可读写的。所以初始化时可以关闭显示，把对应数据写好。

### 显示相关的寄存器
#### LCD Control Register

LCD Control Register 在地址 FF40，可读写，每个 bit 含义如下：
- Bit 7 - LCD Display Enable             (0=Off, 1=On)
- Bit 6 - Window Tile Map Display Select (0=9800-9BFF, 1=9C00-9FFF)
- Bit 5 - Window Display Enable          (0=Off, 1=On)
- Bit 4 - BG & Window Tile Data Select   (0=8800-97FF, 1=8000-8FFF)
- Bit 3 - BG Tile Map Display Select     (0=9800-9BFF, 1=9C00-9FFF)
- Bit 2 - OBJ (Sprite) Size              (0=8x8, 1=8x16)
- Bit 1 - OBJ (Sprite) Display Enable    (0=Off, 1=On)
- Bit 0 - BG Display (for CGB see below) (0=Off, 1=On)

注意事项:
- Bit 7 从1置为0只能在 V-Blank 期间做，否则将损坏硬件。确认是否在 V-Blank 只要读 LY 的值（位于 FF44），当 LY >= 144 时就是 V-Blank。当 LCD 关闭时，VRAM 和 OAM 可以任意访问。
- Bit 0：对于 SGB 和 GB，bit 0置为0表示不画背景（显示白色），但窗口和 sprite 仍然可以画，取决于 bit 1 和 bit 5 的设置；对于 CGB 模式下的 CGB，bit 0置为0表示背景和窗口的优先级被忽略，sprite永远在背景和窗口之上，而不管 OAM 和 BG Map 中的优先级 flag；对于非 CGB 模式下的 CGB，bit 0置为0表示不画背景和窗口，不管 bit 5 设置多少。

#### LCD Status Register

LCD Status Register 在地址 FF41，可读，部分bit可写
- Bit 6 - LYC=LY Coincidence Interrupt (1=Enable) (Read/Write)
- Bit 5 - Mode 2 OAM Interrupt         (1=Enable) (Read/Write)
- Bit 4 - Mode 1 V-Blank Interrupt     (1=Enable) (Read/Write)
- Bit 3 - Mode 0 H-Blank Interrupt     (1=Enable) (Read/Write)
- Bit 2 - Coincidence Flag  (0:LYC<>LY, 1:LYC=LY) (Read Only)
- Bit 1-0 - Mode Flag       (Mode 0-3, see below) (Read Only)

Bit 1-0 组合对应的状态如下：
- 0: During H-Blank，此时 CPU 可访问 VRAM（8000h-9FFFh）和 OAM（FE00h-FE9Fh）
- 1: During V-Blank(or the display is disabled)，同样的，此时 CPU 可访问 VRAM（8000h-9FFFh）和 OAM（FE00h-FE9Fh）
- 2: During Searching OAM-RAM，LCD控制器在读OAM，此时 CPU 不能访问 OAM
- 3: During Transfering Data to LCD Driver。此时 OAM 和 VRAM 都不能被 CPU 访问。如果是 CGB 模式，则 Palette Data (FF69,FF6B) 也不能被访问。

上述 4 种状态典型的时序图如下：

2330002330002330002330002330002331111111111111123000

023三个状态轮换的周期大约是 109 微秒，0占48.6微秒，2占19微秒，3占41微秒。023每隔16.6毫秒会被状态1打断（V-Blank），状态1每次持续1.08毫秒。

以时钟周期记，状态0每次持续 201-207 周期，状态2每次持续 77-83 周期，状态3持续 169-175 周期。023的循环需要 456 周期，在此期间扫描线画完一行；状态1持续 4560 周期，扫描线在第 144 到 153 行。每隔 70224 周期屏幕刷新一次，对应的帧率大约是 60 fps。

#### LCD Position and Scrolling

SCY(FF42) / SCX(FF43): 如前所述，表示 background 在屏幕的偏移。 

LY(FF44) 是只读的，表示当前往 LCD 传输的数据到哪一行了。取值范围是0-153，若值是 144 到 153 之间表示出于 V-Blank。Writing will reset the counter. （意思是往 LY 写任何数都会重置 LY 为 0？）

LYC(FF45) 用于跟 LY 比较，产生中断。见下文。

WY(FF4A) / WX(FF4B)：window 的左上角在屏幕上的偏移。注意 WX 是 window 的 x 轴偏移减去 7。 

需要注意的是，WY/WX 是 window相对于屏幕的偏移，而 SCY/SCX 是屏幕相对于 256x256 的 background 的偏移。

#### LCD Interrupts

LCD相关的中断有两个：
- INT 40，V-Blank中断，发生于 V-Blank 开始时
- INT 48，LCDC Status Interrupt，发生于 LY 和 LYC 相等的时候。一旦相等，STAT寄存器的 coincident bit 被设为1，并且产生一次中断




