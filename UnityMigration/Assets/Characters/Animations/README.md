# CC0 Humanoid Animation Clips

The GitHub Actions workflow named **Import CC0 Humanoid Animations** downloads KinemIQ's 35-clip humanoid FBX pack into the KinemIQ subfolder. It can run automatically after this README changes or manually from the Actions tab. The workflow extracts into a temporary folder before committing, so repeated imports do not overwrite the active checkout.

Source: https://huggingface.co/datasets/Kinemiq/free-game-animations
Archive: KinemIQ_Free_Animations_CC0_FBX.zip
Licence: CC0 1.0 (public domain dedication), free for commercial use with no attribution required.

The clips share a 66-bone, 30 fps humanoid skeleton. The Unity Editor importer marks these FBX files as Humanoid. CharacterAnimatorFactory scans the Characters folder and builds the hero Animator Controller from available Idle, Run/Sprint, Jump, Roll/Crouch, Hit and Death clips.

Before release, inspect the imported clip names and Avatar mappings in Unity. The animation pack does not automatically create a realistic explorer mesh; use the black-suit hero model as the target avatar and verify every retargeted clip in the Animator preview.
