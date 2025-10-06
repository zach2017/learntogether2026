# Claude Code Tutorial: Building a Todo App API

## What is Claude Code?

Claude Code is Anthropic's agentic coding tool that lives in your terminal. Unlike traditional chat interfaces, it can directly edit files, run commands, create commits, and handle complex coding workflows through natural language commands.

## Prerequisites

- Node.js and npm installed on your system
- An Anthropic account (Claude Pro/Max subscription or API access)
- Terminal/command line access

## Step 1: Installation

Open your terminal and install Claude Code globally:

```bash
npm install -g @anthropic-ai/claude-code
```

Verify the installation:
```bash
claude --version
```

## Step 2: Authentication

Navigate to any project directory and start Claude Code:

```bash
claude
```

On first run, you'll be prompted to authenticate. You have two options:

**Option A: Browser Authentication (for Pro/Max users)**
- Type `/login` in the Claude Code session
- Your browser will open for authentication
- Follow the prompts to sign in

**Option B: API Key (for API users)**
- Get your API key from the [Anthropic Console](https://console.anthropic.com)
- Set it as an environment variable:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Step 3: Basic Commands

Claude Code uses slash commands for specific actions:

- `/help` - Shows all available commands
- `/clear` - Clears the context window
- `/exit` - Exits Claude Code
- `/undo` - Undoes the last file change
- `/diff` - Shows recent changes

## Step 4: Practical Example - Building a Todo API

Let's build a simple Express.js Todo API from scratch using Claude Code.

### Start a new project:

```bash
mkdir todo-api
cd todo-api
claude
```

### Step-by-step conversation with Claude:

**You:** "Initialize a new Node.js project with Express and create a basic Todo REST API with CRUD operations"

Claude will:
1. Run `npm init -y` to create package.json
2. Install necessary dependencies (`npm install express cors body-parser`)
3. Create the main server file
4. Set up routes and controllers

**You:** "Add data validation using Joi and create a simple in-memory database"

Claude will:
1. Install Joi (`npm install joi`)
2. Add validation middleware
3. Implement an in-memory storage solution
4. Update the routes with validation

**You:** "Write unit tests for all the endpoints using Jest and Supertest"

Claude will:
1. Install testing dependencies (`npm install --save-dev jest supertest`)
2. Create test files
3. Write comprehensive tests for each endpoint
4. Update package.json with test scripts

**You:** "Run the tests and fix any issues"

Claude will:
1. Execute `npm test`
2. Analyze any failing tests
3. Fix the issues in the code
4. Re-run tests to verify fixes

## Step 5: Advanced Features

### Using @ Mentions
Reference specific files in your prompts:
```
"Update @server.js to add middleware for logging"
```

### Shell Commands
Execute commands directly with `!`:
```
!git status
!npm run test
```

### Custom Commands
Create reusable prompts in `.claude/commands/`:

1. Create the directory:
```bash
mkdir -p .claude/commands
```

2. Add a custom command file `.claude/commands/add-auth.md`:
```markdown
Add JWT authentication to the API:
1. Install jsonwebtoken and bcrypt
2. Create auth middleware
3. Add login and register endpoints
4. Protect existing routes with auth
5. Update tests for authentication
```

3. Use it in Claude Code:
```
/project:add-auth
```

## Step 6: Best Practices

### 1. Clear Context Regularly
Use `/clear` between unrelated tasks to maintain performance:
```
/clear
"Now let's add a new feature..."
```

### 2. Be Specific
Instead of: "Fix the bug"
Use: "The POST /todos endpoint returns 500 when title is missing. Add proper validation"

### 3. Review Changes
Always use `/diff` to review changes before committing:
```
/diff
"Create a commit with a descriptive message for these changes"
```

### 4. Use Permissions Wisely
Create a `.claude/config.json` for project-specific permissions:
```json
{
  "permissions": {
    "allowedTools": [
      "Read",
      "Write(src/**)",
      "Bash(npm *)",
      "Bash(git *)"
    ],
    "deny": [
      "Write(.env)",
      "Bash(rm -rf *)"
    ]
  }
}
```

## Step 7: Complete Workflow Example

Here's a complete workflow for fixing a GitHub issue:

```bash
# Start Claude Code
claude

# Analyze the issue
"Look at GitHub issue #42 and understand what needs to be fixed"

# Claude uses: gh issue view 42

# Find relevant files
"Search the codebase for files related to this issue"

# Implement the fix
"Fix the issue by updating the necessary files"

# Test the changes
"Run the relevant tests to verify the fix works"

# Review changes
/diff

# Create a commit
"Create a commit with message: 'fix: resolve validation error in todo creation (#42)'"

# Push and create PR
"Push the changes and create a pull request referencing issue #42"
```

## Tips for Success

1. **Start Simple**: Begin with small, well-defined tasks before attempting complex refactoring
2. **Provide Context**: Use CLAUDE.md files to give persistent context about your project
3. **Iterate**: Don't expect perfect results on first try - refine your prompts based on outputs
4. **Use MCP Servers**: Connect to GitHub, GitLab, or custom tools for extended capabilities
5. **Monitor Token Usage**: Keep an eye on your API usage if using pay-per-token pricing

## Troubleshooting

- **Authentication Issues**: Try `/login` again or verify your API key is correctly set
- **Permission Denied**: Check your `.claude/config.json` permissions
- **Context Window Full**: Use `/clear` to reset the conversation
- **Unexpected Behavior**: Use `/undo` to revert changes and try a different approach

## Conclusion

Claude Code transforms how you write code by bringing AI assistance directly to your terminal. Start with simple tasks, gradually explore advanced features, and customize it to fit your workflow. The key is to think of Claude Code as a capable pair programmer that can handle routine tasks while you focus on architecture and design decisions.

For more information, visit the [official documentation](https://docs.claude.com/en/docs/claude-code).

