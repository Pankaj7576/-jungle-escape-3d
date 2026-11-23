# Unity bridge and atmosphere assets in the web prototype

Copied without modifying the Unity migration branch:
- `unity_bridge_straight_18m.glb`
- `unity_bridge_turn_left_90.glb`
- `unity_bridge_turn_right_90.glb`
- `unity_bridge_broken_gap.glb`

The active web track now uses the Unity-generated 18 m straight carved-stone bridge module, with 18 m segment spacing and a 4.0 m three-lane layout. The left/right turn and broken-gap GLBs are included as the exact Unity source assets, ready for a later curved-track gameplay port; the current web runner still has straight-only lane movement, so those modules are not yet activated as playable turns/gaps.

Unity ProjectBootstrap configures directional sun intensity 1.15, ambient light (0.42, 0.43, 0.40), fog enabled, fog colour (0.28, 0.32, 0.29), and fog density 0.008. The web scene now uses matching fog colour/density and a directional light intensity of 1.15. The Unity project does not currently define a dynamic weather system or cloud/skybox assets in ProjectBootstrap; this import reproduces the fog/lighting setup rather than inventing clouds or rain.

Unity source branch: `unity-migration/phase-1` (read-only; no changes made).
