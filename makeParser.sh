#!/bin/bash
javac -cp parsing/json-simple-1.1.1.jar parsing/parser.java
jar cfm parsing/spaceshark.jar parsing/manifest.txt parsing/*.jar parsing/*.class
