import { applySwitcheroo } from '../designApplication';
import { ColorSet, ComponentId } from '../dataModels';
import { ComponentBase, ComponentState } from './componentBase';
import { PopupManager } from '../popupManager';

export type PopupState = ComponentState & {
    _type_: 'Popup-builtin';
    anchor?: ComponentId;
    content?: ComponentId;
    color?: ColorSet;
    corner_radius?: number | [number, number, number, number];
    position?: 'left' | 'top' | 'right' | 'bottom' | 'center';
    alignment?: number;
    gap?: number;
    is_open?: boolean;
};

export class PopupComponent extends ComponentBase {
    state: Required<PopupState>;

    private anchorContainer: HTMLElement;
    private contentContainer: HTMLElement;

    private popupManager: PopupManager;

    createElement(): HTMLElement {
        let element = document.createElement('div');
        element.classList.add('rio-popup');

        this.anchorContainer = document.createElement('div');
        this.anchorContainer.classList.add('rio-popup-anchor');
        element.appendChild(this.anchorContainer);

        this.contentContainer = document.createElement('div');
        this.contentContainer.classList.add('rio-popup-content');
        element.appendChild(this.contentContainer);

        // Initialize the popup manager. Many of these values will be
        // overwritten by the updateElement method.
        this.popupManager = new PopupManager(
            this.anchorContainer,
            this.contentContainer,
            'center',
            0,
            0
        );

        return element;
    }

    updateElement(
        deltaState: PopupState,
        latentComponents: Set<ComponentBase>
    ): void {
        super.updateElement(deltaState, latentComponents);

        // Update the children
        this.replaceOnlyChild(
            latentComponents,
            deltaState.anchor,
            this.anchorContainer
        );
        this.replaceOnlyChild(
            latentComponents,
            deltaState.content,
            this.contentContainer
        );

        // Update the popup manager
        if (deltaState.position !== undefined) {
            this.popupManager.position = deltaState.position;
        }

        if (deltaState.alignment !== undefined) {
            this.popupManager.alignment = deltaState.alignment;
        }

        if (deltaState.gap !== undefined) {
            this.popupManager.gap = deltaState.gap;
        }

        // Open / Close
        if (deltaState.is_open !== undefined) {
            this.popupManager.isOpen = deltaState.is_open;
        }

        // Colorize
        if (deltaState.color !== undefined) {
            applySwitcheroo(this.contentContainer, deltaState.color);
        }

        // Update the corner radius
        if (deltaState.corner_radius !== undefined) {
            if (typeof deltaState.corner_radius === 'number') {
                this.contentContainer.style.borderRadius = `${deltaState.corner_radius}rem`;
            } else {
                this.contentContainer.style.borderRadius = `${deltaState.corner_radius[0]}rem ${deltaState.corner_radius[1]}rem ${deltaState.corner_radius[2]}rem ${deltaState.corner_radius[3]}rem`;
            }
        }
    }

    onDestruction(): void {
        super.onDestruction();

        this.popupManager.destroy();
    }
}
