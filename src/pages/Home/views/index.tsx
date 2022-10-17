import React from 'react'
import { HomeViewProps } from '../types'

export const HomeView = ({ viewModel }: HomeViewProps) => {
  // return <h1 title="hello-title">Hello {viewModel.val}</h1>;
  console.log(viewModel.val)
  return <canvas id="webgl" width={window.innerWidth} height={window.innerHeight}></canvas>
}
