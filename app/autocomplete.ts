import {type TrieNode, type Trie} from '../types/trie.ts'

export class AutoComplete implements Trie {
    root: TrieNode;
    
    constructor(words: string[] = []) {
        this.root = {
            letter: '', 
            children: new Map(), 
            is_terminal: false
        };
        
        //Build tree
        for (let word of words)
        {
            this.add_word(word);
        }
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
     * Looks up the prefix in the Trie and returns the matching word(s), otherwise undefined.
     * @param word The prefix to lookup
     * @returns The word(s) in the trie that matches the prefix, otherwise undefined
     * 
     * TODO: Impl behaviour to capture all children
     */
    look_up_prefix(prefix: string): string[] 
    {
        if (prefix === '') { return []; }
        let curr: TrieNode = this.root; 

        for (const lttr of prefix)
        {
            //Creates new TrieNode if mapping doesn't exist
            let nxt_node: TrieNode | undefined = curr.children.get(lttr);
            if (!nxt_node) { return []; } //Prefix does not exist
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
        
        return [word]; 
    }

    find_longest_common_prefix(): string
    {
			//Iterate from root until we get to a child with multiple children
			let lcp: string = '';
			let curr_node: TrieNode = this.root; 

			while (curr_node.children.size == 1 && !curr_node.is_terminal)
			{
				let [nxt_letter] = curr_node.children.keys();
				lcp += nxt_letter; 
				curr_node = curr_node.children.get(nxt_letter) as TrieNode; 
			}

			return lcp;
    }
}