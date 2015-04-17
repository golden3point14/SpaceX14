SpaceX14
========

Visualizing ftrace data. Web application based, using Node.js frameworks.

IMPORTANT NOTE: After pulling a new update, ALWAYS CHOOSE A NEW FILE the first time you run it!

The parser relies on trace-cmd version 2.2.1.2.1

## Downloads
* Linux: [64 bit](https://github.com/golden3point14/SpaceX14/releases/download/v1Linux/spaceshark.tar.gz)

## Instructions

The 64-bit Linux release contains several files: the parser, the application
executable, two auxillary files necessary for the application to run, and a
wrapper script.

To collect trace data, use `trace-cmd record` to generate a .dat file.
The application assumes that you have included scheduling events with the flag
`-e sched`. More information on using `trace-cmd` is available
[here](https://lwn.net/Articles/410200/).

SpaceShark takes a JSON file as input, not a .dat file. To parse a .dat file
into a JSON file, run `java -jar spaceshark.jar <filename>` within the unzipped
directory. Alternately, SpaceShark can be opened with a .dat file using
`./spaceshark -p <filename>`.

Spaceshark can also be run simply with `./spaceshark` or `./spaceshark -o
<filename>`, which opens the application with an already parsed JSON file.

If instead you have cloned the repository, you can run the parser and
application with the following steps.

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
- Choose the .json file that you created using our parser by clicking "Choose File".
- If you have previously used our tool, a second button will appear labeled "Use Last Data". This will return you to your previous session.
