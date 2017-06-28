#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from os import remove, path, system
from shutil import copyfile, rmtree

if __name__ == "__main__":
	if path.exists("./build"):
		rmtree("./build")
	if path.exists("./node_modules"):
		rmtree("./node_modules")
	
	if path.exists("./manifest.json"):
		remove("./manifest.json")
		
	copyfile("./manifest.firefox.json", "./manifest.json")
	system("npm update")
	system("gulp")
	remove("./manifest.json")