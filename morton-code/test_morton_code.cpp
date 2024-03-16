#include <cstdio>
#include <cstdint>
#include <set>
#include <functional>

typedef uint32_t uint;
struct uint2 {
	uint2(int _x, int _y) : x(_x), y(_y) {}
	uint2() {}
	int x, y;
};

uint MortonCode2(uint x)
{
	x &= 0x0000ffff;
	x = (x ^ (x << 8)) & 0x00ff00ff;
	x = (x ^ (x << 4)) & 0x0f0f0f0f;
	x = (x ^ (x << 2)) & 0x33333333;
	x = (x ^ (x << 1)) & 0x55555555;
	return x;
}

uint MortonEncode(uint2 Pixel)
{
	uint Morton = MortonCode2(Pixel.x) | (MortonCode2(Pixel.y) << 1);
	return Morton;
}

uint ReverseMortonCode2(uint x)
{
	x &= 0x55555555;
	x = (x ^ (x >> 1)) & 0x33333333;
	x = (x ^ (x >> 2)) & 0x0f0f0f0f;
	x = (x ^ (x >> 4)) & 0x00ff00ff;
	x = (x ^ (x >> 8)) & 0x0000ffff;
	return x;
}

uint2 MortonDecode(uint Morton)
{
	uint2 Pixel = uint2(ReverseMortonCode2(Morton), ReverseMortonCode2(Morton >> 1));
	return Pixel;
}

uint LinearEncode(uint2 Pixel, uint width)
{
	return Pixel.x + Pixel.y * width;
}

uint AlignTo(uint x, uint alignment)
{
	return x & (~(alignment - 1));
}

inline int Clamp(int x, int low, int high)
{
	return (x < low) ? low : (x > high ? high : x);
}

void test_morton(int texture_size, int alignment, bool clamp_to_edge)
{
	int morton_counts[5] = {};
	int linear_counts[5] = {};

	int image_width = texture_size, image_height = texture_size;
	for (int i = 0; i < image_height; i++) {
		for (int j = 0; j < image_width; j++) {
			// 4 sub pixels
			for (int k = 0; k < 4; k++) {
				int di = (k / 2), dj = (k % 2);   // 0,1
				di = di * 2 - 1; dj = dj * 2 - 1; // -1,1
				int i0 = i, i1 = i + di, j0 = j, j1 = j + dj;
				if (clamp_to_edge) {
					i1 = Clamp(i1, 0, image_height - 1);
					j1 = Clamp(j1, 0, image_width - 1);
				}
				else {
					i1 = (i1 + image_height) % image_height;
					j1 = (j1 + image_width) % image_width;
				}

				// 4 neighbors
				std::set<uint> cache_morton, cache_linear;
				int ii[4] = { i0, i0, i1, i1 }, jj[4] = { j0,j1,j0,j1 };
				for (int m = 0; m < 4; m++) {
					uint morton_code = MortonEncode(uint2(jj[m], ii[m]));
					uint linear = LinearEncode(uint2(jj[m], ii[m]), image_width);
					cache_morton.insert(AlignTo(morton_code, alignment));
					cache_linear.insert(AlignTo(linear, alignment));
				}

				morton_counts[cache_morton.size()]++;
				linear_counts[cache_linear.size()]++;
			}
		}
	}
	int sum_subpixel = 0, sum_morton = 0, sum_linear = 0;
	for (int i = 1; i <= 4; i++) {
		sum_subpixel += linear_counts[i];
		sum_morton += morton_counts[i] * i;
		sum_linear += linear_counts[i] * i;
	}

	printf("test case: texture size: %d, wrap mode: %s\n", texture_size, clamp_to_edge ? "clamp to edge" : "wrap around");
	printf("morton codes: [1]: %.3f, [2]: %.3f, [3]: %.3f, [4]: %.3f, expect: %.3f\n", morton_counts[1] / float(sum_subpixel), morton_counts[2] / float(sum_subpixel), morton_counts[3] / float(sum_subpixel), morton_counts[4] / float(sum_subpixel), float(sum_morton) / sum_subpixel);
	printf("linear index: [1]: %.3f, [2]: %.3f, [3]: %.3f, [4]: %.3f, expect: %.3f\n", linear_counts[1] / float(sum_subpixel), linear_counts[2] / float(sum_subpixel), linear_counts[3] / float(sum_subpixel), linear_counts[4] / float(sum_subpixel), float(sum_linear) / sum_subpixel);
	printf("\n");
}

int main()
{
	int alignment = 32;  // 32 pixels
	test_morton(4, alignment, true);
	test_morton(8, alignment, true);
	test_morton(16, alignment, true);
	test_morton(32, alignment, true);
	test_morton(64, alignment, true);
	test_morton(128, alignment, true);
	test_morton(256, alignment, true);
	test_morton(512, alignment, true);

	test_morton(4, alignment, false);
	test_morton(8, alignment, false);
	test_morton(16, alignment, false);
	test_morton(32, alignment, false);
	test_morton(64, alignment, false);
	test_morton(128, alignment, false);
	test_morton(256, alignment, false);
	test_morton(512, alignment, false);


	system("pause");
	return 0;
}
