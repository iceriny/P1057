#include <iostream>
using namespace std;
// dp[i][j] 表示经过i次传球后，球在j号学生手中的方案数
long long dp[31][31] = {0};
int main()
{
    int n, m;
    cin >> n >> m;

    // 初始状态：球在小蛮（1号学生）手中
    dp[0][1] = 1;

    // 动态规划过程
    for (int i = 1; i <= m; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            // 球可能从左边的同学传来
            int left = j - 1;
            if (left == 0)
                left = n; // 如果是第1个同学的左边，实际上是第n个同学

            // 球可能从右边的同学传来
            int right = j + 1;
            if (right == n + 1)
                right = 1; // 如果是第n个同学的右边，实际上是第1个同学

            // 状态转移
            dp[i][j] = dp[i - 1][left] + dp[i - 1][right];
        }
    }

    // 输出答案：经过m次传球后，球回到小蛮手中的方案数
    cout << dp[m][1] << endl;

    return 0;
}
