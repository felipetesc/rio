import {
    componentsById,
    recursivelyDeleteComponent,
} from "../componentManagement";
import { ComponentId } from "../dataModels";
import { FullscreenPositioner, PopupManager } from "../popupManager";
import { callRemoteMethodDiscardResponse } from "../rpc";
import { ComponentBase, ComponentState } from "./componentBase";

export type DialogContainerState = ComponentState & {
    _type_: "DialogContainer-builtin";
    content?: ComponentId;
    owning_component_id?: ComponentId;
    is_modal?: boolean;
    is_user_closable?: boolean;
};

export class DialogContainerComponent extends ComponentBase {
    declare state: Required<DialogContainerState>;

    private contentContainer: HTMLElement;

    // Dialogs are displayed via a popup manager. While this isn't strictly
    // necessary, this allows sharing the code for whether the dialog is modal,
    // user-closable and general styling.
    private popupManager: PopupManager;

    createElement(): HTMLElement {
        // Create the HTML elements
        let element = document.createElement("div");
        element.classList.add("rio-dialog-container");

        this.contentContainer = document.createElement("div");
        this.contentContainer.classList.add("rio-dialog-container-content");

        // Set up the popup manager
        this.popupManager = new PopupManager({
            anchor: element,
            content: this.contentContainer,
            positioner: new FullscreenPositioner(),
            modal: true,
            userClosable: true,
            onUserClose: this.onUserClose.bind(this),
        });

        // Open the popup manager once we're confident that all components have
        // been created
        requestAnimationFrame(() => {
            this.popupManager.isOpen = true;
        });

        return element;
    }

    onDestruction(): void {
        // Chain up
        super.onDestruction();

        // Tell Python about it
        callRemoteMethodDiscardResponse("dialogClosed", {
            dialogRootComponentId: this.id,
        });

        // Rather than disappearing immediately, the dialog container would like
        // to fade out its content. This doesn't work though, because the
        // content is also deleted when the dialog container is. So create a
        // copy of the container's HTML and animate that instead.
        //
        // Create the copy
        let contentRootElement = this.contentContainer.firstElementChild!;
        let phony = contentRootElement.cloneNode(true) as HTMLElement;

        // Make sure it doesn't interfere with user inputs
        phony.style.pointerEvents = "none";

        phony.querySelectorAll("*").forEach((child) => {
            (child as HTMLElement).style.pointerEvents = "none";
        });

        // Replace the content with the phony element
        contentRootElement.remove();
        this.contentContainer.appendChild(phony);

        // Close the popup manager, thus starting the outgoing animation
        this.popupManager.isOpen = false;

        // Clean up after the animation is done
        setTimeout(
            () => {
                this.popupManager.destroy();
            },
            // Make sure this matches or exceeds the CSS transition duration!
            600
        );
    }

    updateElement(
        deltaState: DialogContainerState,
        latentComponents: Set<ComponentBase>
    ): void {
        super.updateElement(deltaState, latentComponents);

        // Content
        this.replaceOnlyChild(
            latentComponents,
            deltaState.content,
            this.contentContainer
        );

        // Modal
        if (deltaState.is_modal !== undefined) {
            this.popupManager.modal = deltaState.is_modal;
        }

        // User closable
        if (deltaState.is_user_closable !== undefined) {
            this.popupManager.userClosable = deltaState.is_user_closable;
        }

        // Owning component
        if (deltaState.owning_component_id !== undefined) {
            let owningComponent =
                componentsById[deltaState.owning_component_id]!;

            owningComponent.registerChild(latentComponents, this);
        }
    }

    private onUserClose(): void {
        // Destroy the dialog container. This will trigger the destruction
        // function above, thus informing Python and properly cleaning up.
        recursivelyDeleteComponent(this);
    }
}
