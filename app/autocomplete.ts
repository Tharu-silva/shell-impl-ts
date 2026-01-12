import {type TrieNode, type Trie} from '../types/trie.ts'

class AutoComplete implements Trie {
    root: TrieNode;
    
    constructor() {
        this.root = {
            letter: '', 
            children: new Map(), 
            is_terminal: false
        };
    }

    add_word(word: string): void 
    {
        if (word === '') { return; }
        let curr: TrieNode = this.root; 

        for (const lttr of word)
        {
            //Creates new TrieNode if mapping doesn't exist
            let nxt_node: TrieNode = curr.children.get(lttr) ?? (() => {
                const new_node: TrieNode = {
                    letter: lttr,
                    children: new Map(),
                    is_terminal: false
                };
                return new_node;
            })();
            
            curr.children.set(lttr, nxt_node);
            curr = nxt_node; 
        }

        curr.is_terminal = true; 
    }

    /**
     * Looks up the prefix in the Trie and returns a matching word, otherwise undefined.
     * @param word The prefix to lookup
     * @returns A word in the trie that matches the prefix, otherwise undefined
     */
    look_up_prefix(prefix: string): string | undefined 
    {
        if (prefix === '') { return undefined; }
        let curr: TrieNode = this.root; 

        for (const lttr of prefix)
        {
            //Creates new TrieNode if mapping doesn't exist
            let nxt_node: TrieNode | undefined = curr.children.get(lttr);
            if (!nxt_node) { return undefined; } //Prefix does not exist
            curr = nxt_node; 
        }
        
        //Get the first child, first granchild and so on
        let word: string = prefix; 
        
        while (!curr.is_terminal)
        {
            let nxt_letter: string | undefined = curr.children.keys().next().value;
            nxt_letter = nxt_letter ?? ''; //DUMMY Should change in the future
            word += nxt_letter;

            let nxt_node: TrieNode | undefined = curr.children.get(nxt_letter);
            curr = nxt_node ?? curr; 
        }
        
        return word; 
    }
}