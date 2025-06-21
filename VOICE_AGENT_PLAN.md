# Voice Agent Integration Plan

This document outlines the steps to integrate a real-time voice agent into the Intellea application.

## Task 1: Backend Setup for Realtime API

-   [x] Create a new API route `/api/realtime/token` to generate ephemeral client keys for the OpenAI Realtime API. This is necessary for securely connecting from the client-side.

## Task 2: UI for Voice Agent

-   [x] Create a new React component, `VoiceAgentWidget`, which will be a floating action button on the main application view.
-   [x] Clicking the button will open a modal or a dedicated panel for the voice chat interface.
-   [x] This interface will display the transcript of the conversation and provide controls to start/stop the voice session.

## Task 3: Realtime Agent Integration

-   [x] In `VoiceAgentWidget`, initialize `RealtimeAgent` with some basic instructions.
-   [x] Implement the logic to create a `RealtimeSession` and connect to the Realtime API using the ephemeral token from the backend.
-   [x] Handle microphone permissions and audio playback.
-   [x] Display the real-time transcript from the agent in the UI.

## Task 4: Define Agent Tools for UI Control

The core of the voice integration is giving the agent tools to manipulate the application's UI and state. This will be done by creating tools that call functions in our Zustand store (`useAppStore`).

-   [x] **Node Selection Tool**:
    -   [x] Create a tool `selectNode(nodeId: string)` that allows the agent to select a node in the graph.
    -   [x] This tool will call the `setSelectedNodeId` action in the store.

-   [x] **Node Focusing Tool**:
    -   [x] Create a tool `focusOnNode(nodeId: string)` that makes the camera focus on a specific node.
    -   [x] This will call `setFocusedNodeId` and `setActiveFocusPath`.

-   [x] **Node Expansion Tool**:
    -   [x] Create a tool `expandNode(nodeId: string)` to expand a concept.
    -   [x] This will call the `expandConcept` action.

-   [x] **Graph View Tools**:
    -   [x] `toggleGraphFullscreen()`: To enter/exit fullscreen graph view.
    -   [ ] `zoomToFitGraph()`: To fit the graph in the view.

-   [ ] **Scrolling Tools**:
    -   [ ] `scrollToKnowledgeCards()`: To scroll the view to the knowledge cards section.
    -   [ ] `scrollToExplanation()`: To scroll to the explanation section.

## Task 5: Enhance Agent Instructions

-   [x] Update the `RealtimeAgent`'s instructions to be aware of the available tools and how to use them to control the application based on the user's voice commands.

## Task 6: Conversation History and State Management

-   [ ] The `RealtimeSession` history should be displayed in the voice chat UI.
-   [x] The state of the voice session (connecting, connected, disconnected) should be reflected in the UI. 