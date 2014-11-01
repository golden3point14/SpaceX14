SpaceX14
========

Visualizing ftrace data. Web application based, using Node.js frameworks.

## Instructions

Please follow the following instructions to parse a .dat file and run our visualization.

### Parser
The code for the parser is located in parser.java. It reads in a file named 'trace.dat'
from the current directory and creates a file called test.json. 

To run:
- `java -jar spaceshark.jar`


### Visualization

- Download Node-webkit from the appropriate link at https://github.com/rogerwang/node-webkit
- Get the code for our project from this repository
- Paste all of the Node-webkit files into the SpaceX14 directory
- Run the `nw` executable
- Choose the .json file that you created using our parser by clicking Browse... and opening it
