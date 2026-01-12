export interface TrieNode {
    letter: string; 
    children: Map<string, TrieNode>;
    is_terminal: boolean;
}

export interface Trie {
    root: TrieNode;
    add_word(word: string): void;
    look_up_prefix(word: string): string | undefined; 
}