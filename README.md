SpaceX14
========

Visualizing ftrace data. Web application based, using Node.js frameworks.

IMPORTANT NOTE: After pulling a new update, ALWAYS CHOOSE A NEW FILE the first time you run it!

The parser relies on trace-cmd version 2.2.1.2.1

## Instructions

Please follow the following instructions to parse a .dat file and run our visualization.

### Parser
The code for the parser is located in parser.java. A filename to a .dat can be optionally
passed as a command line argument, otherwise it will look for a file called `trace.dat` in
the current directory.

To run:
- `cd parsing`
- `java -jar spaceshark.jar <filename>`

To update the jar file after making changes to the .java file:
- run the makeParser script in the parsing directory

If new libraries are ever added, update the Class-path in manifest.txt.

### Visualization

- Download Node-webkit from the appropriate link at https://github.com/rogerwang/node-webkit
- Get the code for our project from this repository
- Paste all of the Node-webkit files into the SpaceX14 directory
- Run the `nw` executable
- Choose the .json file that you created using our parser by clicking Browse... and opening it
