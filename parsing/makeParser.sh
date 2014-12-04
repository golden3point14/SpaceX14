#!/bin/bash
javac -cp json-simple-1.1.1.jar parser.java
jar cfm spaceshark.jar manifest.txt *.jar *.class
