import sys, json

# from myGraph import Graph

from Graph import Graph
# import numpy as np



def read_in():
  lines = sys.stdin.readlines()
  return json.loads(lines[0])

def main():
  lines = read_in()

  # g = Graph(lines)
  g = Graph(matrix=lines, needSetup=True)
  print(g.exportJson())
  # print('Graph Created')
  # except EmptyMatrixProvided:
  #   print('Empty Matrix Provided')

  # np_lines = np.array(lines)
  # lines = sys.stdin.readlines()
  # print(json.dumps(g))
  # print("Hello World")



if __name__ == '__main__':
  main()