# React and Three.js
This is a simple application showing how to work with Three.js and React.

## Purpose
Present a simple working application that uses Three.js with React, in order to understand some 3D concepts in practice and how to use the library with the framework.

## 3D concepts
It uses some concepts from 3D geometry, like planes, meshs, materials, raycasters, vectors, cameras, scenes, and so on.

## Application
The application shows two different planes (as if they were the floors of a building), with grids dividing them forming 20x20 squares.

It highlights the square right below the pointer on mouse movement and also it creates a some sphere when clicking on the highlighted square.

Also, there's a raycaster (presented in a form of an arrow) showing which planes were hit on the mouse click. The point here is that the sphere object will only be rendered on the square on the first plane hit.

<div align="center">
  <image src="./docs/img/example.png" width="550" height="300">
  <div>Screen of the application</div>
</div>

## Installation
You have to have [Node](https://nodejs.org/en/download/) installed.

Then, git clone the repository:
```bash
git clone https://github.com/Guilospanck/react-and-threejs.git
```

## How to run
Cd into the cloned repository:
```bash
cd react-and-threejs/
```
And then run either
```bash
yarn
```
or
```bash
npm install
```
to install all dependencies.

Now, run:
```bash
yarn start:dev
```

The application will be running at [https://localhost:3000/](https://localhost:3000/).
