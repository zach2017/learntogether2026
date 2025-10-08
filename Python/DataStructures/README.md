I'll convert this visual guide to text and explain each of the 16 coding patterns with simple Python examples.

## 16 Essential Coding Patterns You Should Know

### 1. **Two-Pointer Technique**
Uses two pointers to traverse an array, often from different positions or at different speeds.

```python
def two_sum_sorted(arr, target):
    left, right = 0, len(arr) - 1
    
    while left < right:
        current_sum = arr[left] + arr[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return []

# Example: Find two numbers that sum to 10
arr = [1, 5, 8, 9, 10, 13, 17]
print(two_sum_sorted(arr, 14))  # Output: [1, 2] (5 + 9 = 14)
```

### 2. **HashMaps**
Use key-value pairs for O(1) lookup time to solve problems efficiently.

```python
def two_sum(nums, target):
    hashmap = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hashmap:
            return [hashmap[complement], i]
        hashmap[num] = i
    return []

# Example: Find indices of two numbers that sum to target
nums = [2, 7, 11, 15]
print(two_sum(nums, 9))  # Output: [0, 1]
```

### 3. **Linked Lists**
A sequence of nodes where each node contains data and a reference to the next node.

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev = None
    current = head
    
    while current:
        next_temp = current.next
        current.next = prev
        prev = current
        current = next_temp
    
    return prev

# Example: Create and reverse a linked list A -> B -> C
head = ListNode('A', ListNode('B', ListNode('C')))
```

### 4. **Fast and Slow Pointers**
Two pointers moving at different speeds, useful for cycle detection and finding middle elements.

```python
def has_cycle(head):
    if not head:
        return False
    
    slow = fast = head
    
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    
    return False

def find_middle(head):
    slow = fast = head
    
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    
    return slow  # Middle node
```

### 5. **Sliding Window Technique**
Maintains a window that slides through the array to find subarrays meeting certain conditions.

```python
def max_sum_subarray(arr, k):
    if len(arr) < k:
        return None
    
    # Calculate sum of first window
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    # Slide the window
    for i in range(len(arr) - k):
        window_sum = window_sum - arr[i] + arr[i + k]
        max_sum = max(max_sum, window_sum)
    
    return max_sum

# Example: Find max sum of 3 consecutive elements
arr = [1, 5, 8, 9, 10, 13, 17]
print(max_sum_subarray(arr, 3))  # Output: 40 (13+17+10)
```

### 6. **Binary Search**
Efficiently search in sorted arrays by repeatedly dividing the search space in half.

```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Example: Search for 10 in sorted array
arr = [1, 5, 8, 9, 10, 13, 17]
print(binary_search(arr, 10))  # Output: 4
```

### 7. **Stacks**
Last-In-First-Out (LIFO) data structure for tracking state or matching pairs.

```python
def is_valid_parentheses(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    
    return len(stack) == 0

# Example: Check if parentheses are balanced
print(is_valid_parentheses("({[]})"))  # Output: True
print(is_valid_parentheses("({[}])"))  # Output: False
```

### 8. **Heaps**
Tree-based structure maintaining the heap property (min-heap or max-heap) for priority operations.

```python
import heapq

def find_k_largest(nums, k):
    # Create a min-heap with k elements
    heap = nums[:k]
    heapq.heapify(heap)
    
    # Process remaining elements
    for num in nums[k:]:
        if num > heap[0]:
            heapq.heappop(heap)
            heapq.heappush(heap, num)
    
    return heap[0]  # kth largest element

# Example: Find 3rd largest element
nums = [7, 4, 12, 5, 2]
print(find_k_largest(nums, 3))  # Output: 5
```

### 9. **Prefix Sum**
Pre-compute cumulative sums for efficient range sum queries.

```python
def range_sum_query(arr):
    # Build prefix sum array
    prefix = [0]
    for num in arr:
        prefix.append(prefix[-1] + num)
    
    def sum_range(i, j):
        return prefix[j + 1] - prefix[i]
    
    return sum_range

# Example: Query sum of elements from index 1 to 3
arr = [1, 2, 3, 4, 5, 6]
query = range_sum_query(arr)
print(query(1, 3))  # Output: 9 (2+3+4)
```

### 10. **Trees**
Hierarchical data structure with nodes connected by edges, no cycles.

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traversal(root):
    result = []
    
    def inorder(node):
        if node:
            inorder(node.left)
            result.append(node.val)
            inorder(node.right)
    
    inorder(root)
    return result

# Example: Create tree and traverse
root = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), 
                   TreeNode(3, TreeNode(6), TreeNode(7)))
```

### 11. **Tries**
Tree structure for efficient string storage and prefix searching.

```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_word = True
    
    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_word

# Example: Store and search words
trie = Trie()
trie.insert("inter")
trie.insert("internet")
print(trie.search("inter"))  # Output: True
```

### 12. **Graphs**
Network of nodes (vertices) connected by edges, can be directed or undirected.

```python
from collections import defaultdict, deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    
    return result

# Example: BFS traversal
graph = {
    'A': ['B', 'C'],
    'B': ['D'],
    'C': ['E'],
    'D': [],
    'E': []
}
print(bfs(graph, 'A'))  # Output: ['A', 'B', 'C', 'D', 'E']
```

### 13. **Backtracking**
Explore all possibilities by trying choices and undoing them if they don't lead to a solution.

```python
def generate_permutations(nums):
    result = []
    
    def backtrack(path, remaining):
        if not remaining:
            result.append(path[:])
            return
        
        for i in range(len(remaining)):
            # Make choice
            path.append(remaining[i])
            # Explore
            backtrack(path, remaining[:i] + remaining[i+1:])
            # Undo choice
            path.pop()
    
    backtrack([], nums)
    return result

# Example: Generate all permutations
print(generate_permutations([1, 2, 3]))
# Output: [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
```

### 14. **Dynamic Programming**
Break complex problems into overlapping subproblems and store solutions to avoid redundant computation.

```python
def fibonacci(n):
    if n <= 1:
        return n
    
    # Bottom-up approach
    dp = [0, 1]
    
    for i in range(2, n + 1):
        dp.append(dp[i-1] + dp[i-2])
    
    return dp[n]

def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    
    return dp[amount] if dp[amount] != float('inf') else -1

# Example: Minimum coins for amount 11
print(coin_change([1, 5, 10], 11))  # Output: 2 (10+1)
```

### 15. **Greedy Algorithm**
Make locally optimal choices at each step, hoping to find a global optimum.

```python
def activity_selection(activities):
    # Sort by finish time
    activities.sort(key=lambda x: x[1])
    
    selected = [activities[0]]
    last_finish = activities[0][1]
    
    for i in range(1, len(activities)):
        if activities[i][0] >= last_finish:
            selected.append(activities[i])
            last_finish = activities[i][1]
    
    return selected

# Example: Select maximum non-overlapping activities
# Format: (start_time, end_time)
activities = [(1, 3), (2, 5), (3, 8), (5, 7), (8, 10)]
print(activity_selection(activities))  # Output: [(1, 3), (5, 7), (8, 10)]
```

### 16. **Intervals**
Problems involving ranges with start and end points (merging, overlapping, gaps).

```python
def merge_intervals(intervals):
    if not intervals:
        return []
    
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    
    for interval in intervals[1:]:
        if interval[0] <= merged[-1][1]:
            # Overlapping - merge them
            merged[-1][1] = max(merged[-1][1], interval[1])
        else:
            # Non-overlapping - add new interval
            merged.append(interval)
    
    return merged

# Example: Merge overlapping intervals
intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]
print(merge_intervals(intervals))  # Output: [[1, 6], [8, 10], [15, 18]]
```

Each of these patterns is fundamental to solving coding problems efficiently. Mastering them will help you recognize which approach to use when facing new problems and significantly improve your problem-solving skills.