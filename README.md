Implementation of a POSIX compliant shell

Features that work
- Standard builtins 
- Navigation 
- Quoting with single and double quotes
- IO redirection
- Autocompletion 

In progress features
- Pipelines
- History & History persistence

**Project structure**

```
├── app/
│   ├── autocomplete.ts    # Autocompletion logic
│   ├── exec.ts            # Logic related to executables
│   ├── handlers.ts        # Handlers for various commands and operations
│   ├── main.ts            # Entry point of the application
│   ├── symbols.ts         # Common symbols and constants
│   └── utils.ts           # Utility functions
│
├── tests/
│   └── utils.test.ts      # Tests for utility functions
│
└── types/
    ├── common.ts          # Common types used across the project
    └── trie.ts            # Types related to trie data structure used for autocompletion
```