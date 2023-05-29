from queue import LifoQueue


class Node:
    def __init__(self, value) -> None:
        self.value = value
        self.children = []
        self.children_view = set()
    def add_child(self, child):
        self.children.append(child)
        self.children_view.add(child)
    def __str__(self) -> str:
        return self.value


def generate_structure(data):
    nodes:dict[any,Node] = {}
    """
    data {target -> location }
    data {target -> location }
    data {target -> location }
    生成关系连接
    target -> location
                    -> location
                            -> location
    """
    for relation in data:
        target = relation["target"]
        location = relation["location"]
        parent_node = nodes.get(target)
        if not parent_node:
            parent_node = Node(target)
            nodes[target] = parent_node
        
        child_node = nodes.get(location)
        if not child_node:
            child_node = Node(location)
            nodes[location] = child_node
            
        parent_node.add_child(child_node)    
    
    roots = set()
    # 节点不被任何连接 则是 root
    for node in nodes.values():
        if not any(n for n in nodes.values() if node in n.children_view):
            roots.add(node)
            continue
            
    return roots

data = [
{'target':"A","location":"B"},
{"target":"B","location":"C"},
{"target":"C","location":"B"},
{"target":"B","location":"D"},
{"target":"D","location":"E"},
{"target":"D","location":"F"},
{"target":"F","location":"E"},
{"target":"E","location":"G"},
{"target":"E","location":"P"},
]              

roots = generate_structure(data)
print("roots:",len(roots))
class LevelNode:
    def __init__(self,node:Node,deth:int) -> None:
        self.node = node 
        self.deth = deth
        
def dfs_str_structure(root:Node,str=""):
    str = ""
    
    stack = LifoQueue()
    visited = set()
    
    stack.put(LevelNode(root,0))
    
    while not stack.empty():
        dn:LevelNode = stack.get()
        
        if  dn.node in  visited:
            str = "{0}\n{1}{2}".format(str,"---" * dn.deth,dn.node.value)
        else:    
            str = "{0}\n{1}{2}".format(str,"---" * dn.deth,dn.node.value)
            
            for child_node in dn.node.children:
                stack.put(LevelNode(child_node,dn.deth+1))
                
            visited.add(dn.node)
            
    return str    
    
for root in roots:
    print(dfs_str_structure(root))
    
    