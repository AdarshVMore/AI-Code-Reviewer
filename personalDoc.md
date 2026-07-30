# Some New Feature to Add
  - dropdown of > Review, and in description why and how
  - celebrate Good things with green tick ✓ and yellow , red for issues with dropdown
  - "Apply Suggestions" link in each issue => redirects to deployment fix buttons (or run a cURL api-req that will run that specific deployment fix)
  - human language review (the prompt we have)
  - if user => "git commit" or "git add" we will first run the CLI "coderefyn review" to show all reviews and checks then commit somehow
  - buttons to explain from AST
    - Explain this File {4 types, 3 functions, this used in this, this is exported in this file....}
    - Show me the Flow for this feature / class in all codebase and files
    - Find Dead Code in these
  - dropdown Architecture map of the Codebase "function to function"

# Some New Tech to Use
  - Local LLM usage for Code Safety
  - basic CLI with command to review code
  - Parallel execution of tasks / tools AKA Sub-agents
  - web search tool if Required for any query
  - Index AST chunks, PRs, Codebase properly
  - Sandboxing to clone repo => create AST => check lint and ts errors based on new code added => etc (can be done in CICD as well)
  - Memory for your Codechanges adn feedback (it feels useless here though)

# Before Final Deploy
  - UI
    - Loading
    - Colors
    - Component alignment
    - Landing page showing How to use and Working of features

# how AST looks like
FunctionDeclaration
    Block
        IfStatement
            BinaryExpression
                Identifier
                GreaterThan
                NumericLiteral
            Block
                ExpressionStatement
                    CallExpression
                        Identifier
                        PropertyAccessExpression
        WhileStatement
            BinaryExpression
            Block
                ...

normal node we embeed : 
{
  kind: "FunctionDeclaration",
  name: "addOrder",
  parameters: [...],
  body: {...},
  pos: 1023,
  end: 1358
}