'use strict'

const NO_FILE_TEXT = 'No file'
const PLACEHOLDER_VALUE = 'placeholder'
const COLORS = ['#ffb300', '#c6583e', '#668f3c', '#617db4', '#b956af']
const EDGE_TYPES = ['curve', 'curvedArrow']

function getNodeById(id) {
  var foundNode
  sigmaInst.graph.nodes().forEach((node) => {
    if (node.id === id) foundNode = node
  })
  return foundNode
}

function getEdgeById(id) {
  var foundEdge
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.id === id) foundEdge = edge
  })
  return foundEdge
}

function updateGraphInfo() {
  $('#nodes-number').text(sigmaInst.graph.nodes().length)
  $('#edges-number').text(sigmaInst.graph.edges().length)
  $('#nodes-powers').empty()
  $('#incidence-matrix').empty()

  $('#incidence-matrix').append('<tr><th></th>' + incidenceHeader() + '</tr>')
  sigmaInst.graph.nodes().forEach((node) => {
    $('#incidence-matrix').append('<tr><td>' + node.id + '</td>' + incidenceLine(node) + '</tr>')
    $('#nodes-powers').append('<li>' + node.id + ': ' + nodePower(node) + '</li>')
  })

  if (isComplete()) {
    $('#completeness').text('Graph is complete')
  } else {
    $('#completeness').text('Graph is incomplete')
  }

  $('#graph-name').text($('.selected-tab > .tab-content').text())
}

function incidenceLine(node) {
  var line = ''
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.source === node.id || (edge.target === node.id && edge.type === 'curve')) {
      line += '<td>1</td>'
    } else {
      line += '<td>0</td>'
    }
  })

  return line
}

function incidenceHeader() {
  var header = ''

  sigmaInst.graph.edges().forEach((edge) => {
    header += '<th>' + edge.id + '</th>'
  })
  return header
}

function clearNodeInfo() {
  var colorInput = $('#node-color-input')
  colorInput.val(PLACEHOLDER_VALUE)
  colorInput.removeClass().addClass('color-input-white')
  $('#node-info').removeAttr('data-id')
  $('#node-label-input').val('')
  $('#node-id-label').empty()
  $('#node-data-input').val('')
  $('#file-name').text(NO_FILE_TEXT)
  $('#node-power').empty()
  $('#node-shape-input').val(PLACEHOLDER_VALUE)
}

function clearEdgeInfo() {
  var edgeColorInput = $('#edge-color-input')
  edgeColorInput.val(PLACEHOLDER_VALUE)
  edgeColorInput.removeClass().addClass('color-input-white')
  $('#edge-info').removeAttr('data-id')
  $('#edge-id-label').empty()
}

function graphName(path) {
  return path.split('/').pop().split('.')[0]
}

function clearGraph() {
  sigmaInst.graph.clear()
  sigmaInst.refresh()
  clearEdgeInfo()
  clearNodeInfo()
  clearSearch()
  updateGraphInfo()
}

function clearSearch() {
  $('#path-length').text('')
  $('#paths-information').empty()
  $('#cycles-information').empty()
}

function graphData() {
  return '{ "nodes": ' + JSON.stringify(sigmaInst.graph.nodes()) + ',\n' +
           '"edges": ' + JSON.stringify(sigmaInst.graph.edges()) + ' }'
}

function emptyGraphData() {
  return "{ &quot;nodes&quot;: [], &quot;edges&quot;: [] }"
}

function adjacentNodeIds(node) {
  var ids = []
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.source === node.id) {
      ids.push(edge.target)
    } else if (edge.target === node.id && edge.type === 'curve') ids.push(edge.source)
  })
  return ids
}

function adjacentNodes(node) {
  var nodes = []
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.source === node.id) {
      nodes.push(getNodeById(edge.target))
    } else if (edge.target === node.id && edge.type === 'curve') nodes.push(getNodeById(edge.source))
  })
  return nodes
}

function nodePower(node) {
  var power = 0
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.source === node.id || (edge.target === node.id && edge.type === 'curve')) power++
  })
  return power
}

function isComplete() {
  var isComplete = true
  var nodes = sigmaInst.graph.nodes()
  var edges = sigmaInst.graph.edges()
  var nodeIds = []
  var targets = []

  nodes.forEach((node) => nodeIds.push(node.id))

  nodes.forEach((node) => {
    targets = []
    adjacentNodeIds(node).forEach((nodeId) => targets.push(nodeId))
    isComplete = isComplete && isSetsEqual(targets, arrayRemove(nodeIds, node.id))
  })

  edges.forEach((edge) => {
    if (edge.type === 'curvedArrow') isComplete = false
  })

  return isComplete
}

function toComplete() {
  var nodes = sigmaInst.graph.nodes()
  var nodeIds = []
  var targets = []
  var targetsToAdd = []

  removeMultipleEdges()
  removeDirectedEdges()
  removeLoops()

  nodes.forEach((node) => nodeIds.push(node.id))

  nodes.forEach((node) => {
    targets = []
    adjacentNodeIds(node).forEach((nodeId) => targets.push(nodeId))

    targetsToAdd = difference(arrayRemove(nodeIds, node.id), targets)
    targetsToAdd.forEach((id) => {
      sigmaInst.graph.addEdge({
        id: newEdgeId(),
        source: node.id,
        target: id,
        type: 'curve',
        size: 3,
        color: '#668f3c'
      })
    })
  })

  sigmaInst.refresh()
  updateGraphInfo()
}

function removeLoops() {
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.source === edge.target) sigmaInst.graph.dropEdge(edge.id)
  })
}

function removeDirectedEdges() {
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.type === 'curvedArrow') sigmaInst.graph.dropEdge(edge.id)
  })
}

function removeMultipleEdges() {
  sigmaInst.graph.edges().forEach((firstEdge) => {
    sigmaInst.graph.edges().forEach((secondEdge) => {
      if (firstEdge.source === secondEdge.source && firstEdge.target === secondEdge.target && firstEdge.id !== secondEdge.id) sigmaInst.graph.dropEdge(secondEdge.id)
    })
  })
}

function newNodeId() {
  var nodes = sigmaInst.graph.nodes()
  var max = nodes.length > 0 ? parseInt(nodes[0].id) : 0
  var id
  nodes.forEach((node) => {
    id = parseInt(node.id)
    if (id > max) max = id
  })
  return (max + 1).toString()
}

function newEdgeId() {
  var edges = sigmaInst.graph.edges()
  var max = edges.length > 0 ? parseInt(edges[0].id) : 0
  var id
  edges.forEach((edge) => {
    id = parseInt(edge.id)
    if (id > max) max = id
  })
  return (max + 1).toString()
}

function multipleEdgesCount(source, target) {
  var counter = 0
  sigmaInst.graph.edges().forEach((edge) => {
    if (edge.source === source && edge.target === target) counter++
  })
  return counter
}

function findAllPaths(from, to) {
  var paths = []
  var step = function (node, _visited) {
    var visited = [..._visited]
    visited.push(node)
    if (node === to) paths.push(visited)
    difference(adjacentNodes(node), visited).forEach((nextNode) => {
      step(nextNode, visited)
    })
  }

  step(from, [])
  return paths
}

function pathToString(path) {
  var string = ''
  path.forEach((node) => {
    string += node.id + ' => '
  })
  string = string.slice(0, -4)
  return string + "\n";
}

function shortestPath(paths) {
  if (!paths) return
  var minLength = paths[0].length
  var min = paths[0];
  paths.forEach((path) => {
    if (path.length < minLength) {
      minLength = path.length
      min = path
    }
  })
  return min
}

function edgesBetween(first, second) {
  var edges = []
  sigmaInst.graph.edges().forEach((edge) => {
    if ((edge.source === first.id && edge.target === second.id) || (edge.target === first.id && edge.source === second.id && edge.type === 'curve')) edges.push(edge)
  })
  return edges
}
