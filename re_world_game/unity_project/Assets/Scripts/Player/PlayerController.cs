using System;
using UnityEngine;

namespace REWorld.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        public float moveSpeed = 6.0f;
        public float runSpeed = 10.0f;
        public float jumpHeight = 1.25f;
        public float gravity = -19.62f;

        [Header("Camera & Look Settings")]
        public Transform cameraTransform;
        public float mouseSensitivity = 2.0f;
        public float upperPitchLimit = 85.0f;
        public float lowerPitchLimit = -85.0f;

        [Header("Interaction Settings")]
        public float raycastDistance = 4.0f;
        public LayerMask interactableMask;

        private CharacterController controller;
        private Vector3 velocity;
        private float cameraPitch = 0f;
        private bool isGrounded;
        private bool isInputLocked = false;

        public event Action<string> OnObjectLookedAt;

        private void Start()
        {
            controller = GetComponent<CharacterController>();
            if (cameraTransform == null && Camera.main != null)
            {
                cameraTransform = Camera.main.transform;
            }

            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        private void Update()
        {
            if (isInputLocked) return;

            HandleGroundCheck();
            HandleMouseLook();
            HandleMovement();
            HandleInteractionRaycast();
        }

        private void HandleGroundCheck()
        {
            isGrounded = controller.isGrounded;
            if (isGrounded && velocity.y < 0)
            {
                velocity.y = -2f;
            }
        }

        private void HandleMouseLook()
        {
            float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity * 50f * Time.deltaTime;
            float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity * 50f * Time.deltaTime;

            cameraPitch -= mouseY;
            cameraPitch = Mathf.Clamp(cameraPitch, lowerPitchLimit, upperPitchLimit);

            if (cameraTransform != null)
            {
                cameraTransform.localRotation = Quaternion.Euler(cameraPitch, 0f, 0f);
            }
            transform.Rotate(Vector3.up * mouseX);
        }

        private void HandleMovement()
        {
            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");

            bool isRunning = Input.GetKey(KeyCode.LeftShift);
            float currentSpeed = isRunning ? runSpeed : moveSpeed;

            Vector3 moveDirection = transform.right * horizontal + transform.forward * vertical;
            controller.Move(moveDirection * currentSpeed * Time.deltaTime);

            if (Input.GetButtonDown("Jump") && isGrounded)
            {
                velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            }

            velocity.y += gravity * Time.deltaTime;
            controller.Move(velocity * Time.deltaTime);
        }

        private void HandleInteractionRaycast()
        {
            if (cameraTransform == null) return;

            Ray ray = new Ray(cameraTransform.position, cameraTransform.forward);
            if (Physics.Raycast(ray, out RaycastHit hit, raycastDistance))
            {
                OnObjectLookedAt?.Invoke(hit.collider.gameObject.name);

                if (Input.GetKeyDown(KeyCode.E))
                {
                    IInteractable interactable = hit.collider.GetComponent<IInteractable>();
                    if (interactable != null)
                    {
                        interactable.Interact(this);
                    }
                }
            }
            else
            {
                OnObjectLookedAt?.Invoke(null);
            }
        }

        public void SetInputLock(bool locked)
        {
            isInputLocked = locked;
            Cursor.lockState = locked ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = locked;
        }
    }

    public interface IInteractable
    {
        void Interact(PlayerController player);
        string GetPromptText();
    }
}
