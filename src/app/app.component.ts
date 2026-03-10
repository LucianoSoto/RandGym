import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import exercisesData from '../assets/exercises.json';

type Exercise = {
  nombre: string;
  hechoUltimaVez: string;
  pesoKg?: number;
  series?: string;
};

type SelectedItem = {
  grupo: string;
  ejercicio: Exercise | null;
};

type NewExerciseForm = {
  grupo: string;
  nombre: string;
  pesoKg?: number | null;
  series?: string;
};

const EXERCISES = exercisesData as Record<string, Exercise[]>;
const STORAGE_KEY = 'randgym.exercises';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="hero">
        <p class="kicker">RandGym</p>
        <h1>Rutina aleatoria por grupo muscular</h1>
        <p class="sub">Pulsa el boton para elegir un ejercicio disponible por grupo.</p>
        <div class="hero-actions">
          <button id="randExe" class="primary" (click)="generateRandom()">A ejercitarse!</button>
          <button class="primary alt" (click)="openAdd()">Agregar ejercicio</button>
        </div>
      </header>

      <section class="cards" *ngIf="hasGenerated">
        <article class="card" *ngFor="let item of selected">
          <div class="card-head">
            <h2>{{ item.grupo }}</h2>
            <span class="status" [class.done]="isDoneRecently(item.ejercicio)">{{ isDoneRecently(item.ejercicio) ? 'Completo' : 'Pendiente' }}</span>
          </div>

          <div class="card-body" *ngIf="item.ejercicio; else noExercise">
            <p class="exercise-name">{{ item.ejercicio?.nombre }}</p>
            <p class="exercise-values" *ngIf="item.ejercicio">
              Peso: {{ item.ejercicio.pesoKg || 0 }} kg · Series: {{ item.ejercicio.series || '-' }}
            </p>
            <div class="actions">
              <button
                class="secondary"
                (click)="markComplete(item)"
                [disabled]="isDoneRecently(item.ejercicio)"
              >
                Completo
              </button>
              <button class="secondary" (click)="toggleEdit(item.grupo)">
                {{ isEditing(item.grupo) ? 'Editar valores' : 'Cambiar valores' }}
              </button>
            </div>
            <div class="form-row" *ngIf="isEditing(item.grupo)">
              <label>
                Peso (kg)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  [(ngModel)]="item.ejercicio.pesoKg"
                  (ngModelChange)="persistData()"
                />
              </label>
              <label>
                Series
                <input
                  type="text"
                  placeholder="Ej: 3x10"
                  [(ngModel)]="item.ejercicio.series"
                  (ngModelChange)="persistData()"
                />
              </label>
              <button class="secondary save" (click)="closeEdit(item.grupo)">Guardar</button>
            </div>
          </div>

          <ng-template #noExercise>
            <p class="empty">Sin ejercicios disponibles</p>
          </ng-template>
        </article>
      </section>

      <section class="modal" *ngIf="showCongrats">
        <div class="modal-backdrop" (click)="closeModal()"></div>
        <div class="modal-card" role="dialog" aria-modal="true">
          <h3>Felicitaciones! Completaste los 5 ejercicios!</h3>
          <button class="primary" (click)="closeModal()">Cerrar</button>
        </div>
      </section>

      <section class="modal" *ngIf="showAddModal">
        <div class="modal-backdrop" (click)="closeAdd()"></div>
        <div class="modal-card" role="dialog" aria-modal="true">
          <h3>Agregar ejercicio</h3>
          <form class="form-row add-form" (ngSubmit)="addExercise()">
            <label>
              Grupo
              <select [(ngModel)]="newExercise.grupo" name="grupo" required>
                <option *ngFor="let grupo of groups" [value]="grupo">{{ grupo }}</option>
              </select>
            </label>
            <label>
              Nombre
              <input
                type="text"
                name="nombre"
                placeholder="Ej: Press banca"
                [(ngModel)]="newExercise.nombre"
                required
              />
            </label>
            <label>
              Peso (kg)
              <input
                type="number"
                min="0"
                step="0.5"
                name="pesoKg"
                [(ngModel)]="newExercise.pesoKg"
              />
            </label>
            <label>
              Series
              <input
                type="text"
                name="series"
                placeholder="Ej: 3x10"
                [(ngModel)]="newExercise.series"
              />
            </label>
            <div class="modal-actions">
              <button type="submit" class="primary">Agregar</button>
              <button type="button" class="secondary" (click)="closeAdd()">Cancelar</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        color: var(--ink);
        background: var(--bg);
        min-height: 100vh;
        font-size: 20px;
      }

      .page {
        max-width: 1120px;
        margin: 0 auto;
        padding: 48px 24px 72px;
        font-family: "Zalando Sans", "Uncut Sans", "Segoe UI", Tahoma, sans-serif;
      }

      .hero {
        background:
          radial-gradient(circle at top right, rgba(79, 70, 255, 0.18), transparent 45%),
          radial-gradient(circle at 20% 80%, rgba(0, 194, 255, 0.18), transparent 40%),
          var(--surface);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 32px 36px;
        box-shadow: 0 18px 40px rgba(15, 24, 40, 0.08);
      }

      .kicker {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 16px;
        color: var(--accent);
        margin: 0 0 8px;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 50px;
        color: var(--ink);
      }

      .sub {
        margin: 0 0 20px;
        color: var(--ink-muted);
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 999px;
        padding: 14px 32px;
        background: linear-gradient(120deg, var(--accent) 0%, var(--accent-2) 100%);
        color: #ffffff;
        font-weight: 700;
        font-size: 18px;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .primary.alt {
        background: linear-gradient(120deg, var(--accent-2) 0%, var(--accent-3) 100%);
      }

      .primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 26px rgba(79, 70, 255, 0.25);
      }

      .cards {
        margin-top: 28px;
        display: grid;
        gap: 20px;
        grid-template-columns: 1fr;
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 210px;
        box-shadow: 0 16px 36px rgba(15, 24, 40, 0.06);
      }

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      h2 {
        margin: 0;
        font-size: 26px;
        color: var(--ink);
      }

      .status {
        font-size: 16px;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--surface-strong);
        color: var(--ink-muted);
      }

      .status.done {
        background: rgba(79, 70, 255, 0.12);
        color: var(--accent);
      }

      .exercise-name {
        font-weight: 600;
        font-size: 24px;
        color: var(--ink);
        margin: 0 0 10px;
      }

      .exercise-values {
        margin: 0 0 12px;
        font-size: 18px;
        color: var(--ink-muted);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 12px;
        margin-bottom: 12px;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        align-items: end;
      }

      .form-row label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 16px;
        color: var(--ink-muted);
      }

      .form-row input {
        border-radius: 12px;
        border: 1px solid var(--line);
        padding: 10px 12px;
        font-size: 17px;
        font-family: inherit;
        color: var(--ink);
        background: #ffffff;
      }

      .form-row select {
        border-radius: 12px;
        border: 1px solid var(--line);
        padding: 10px 12px;
        font-size: 17px;
        font-family: inherit;
        color: var(--ink);
        background: #ffffff;
      }

      .form-row input:focus {
        outline: 2px solid rgba(79, 70, 255, 0.2);
        border-color: var(--accent);
      }

      .form-row select:focus {
        outline: 2px solid rgba(79, 70, 255, 0.2);
        border-color: var(--accent);
      }

      .add-form {
        margin-top: 16px;
      }

      .save {
        justify-self: end;
      }

      .modal-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 8px;
      }

      .modal-actions .primary,
      .modal-actions .secondary {
        width: 100%;
        margin-top: 0;
        justify-content: center;
      }

      .secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: flex-start;
        border: 1px solid var(--line);
        background: var(--surface-strong);
        color: var(--ink);
        border-radius: 999px;
        padding: 12px 28px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 12px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .secondary:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 22px rgba(15, 24, 40, 0.08);
      }

      .secondary:disabled {
        opacity: 0.6;
        cursor: default;
        box-shadow: none;
        transform: none;
      }

      .empty {
        margin: 0;
        color: var(--ink-muted);
        font-size: 18px;
      }

      .modal {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        z-index: 10;
      }

      .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(9, 16, 30, 0.5);
      }

      .modal-card {
        position: relative;
        z-index: 1;
        background: var(--surface);
        border-radius: 20px;
        padding: 28px 32px;
        border: 1px solid var(--line);
        box-shadow: 0 30px 60px rgba(9, 16, 30, 0.25);
        max-width: 520px;
        width: calc(100% - 48px);
        text-align: center;
      }

      .modal-card h3 {
        margin: 0 0 16px;
        font-size: 28px;
      }

      @media (max-width: 720px) {
        .page {
          padding: 32px 18px 48px;
        }

        .hero-actions {
          flex-direction: column;
        }

        .hero-actions .primary {
          width: 100%;
        }

        h1 {
          font-size: 40px;
        }

        .card {
          padding: 18px 20px;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .modal-card {
          padding: 22px 20px;
        }

        .modal-actions {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class AppComponent {
  data: Record<string, Exercise[]> = this.loadData();
  groups = Object.keys(this.data);
  selected: SelectedItem[] = [];
  hasGenerated = false;
  showCongrats = false;
  editing: Record<string, boolean> = {};
  showAddModal = false;
  newExercise: NewExerciseForm = this.defaultNewExercise();

  generateRandom(): void {
    this.selected = this.groups.map((grupo) => ({
      grupo,
      ejercicio: this.pickRandom(grupo)
    }));
    this.hasGenerated = true;
    this.showCongrats = false;
    this.editing = {};
  }

  markComplete(item: SelectedItem): void {
    if (!item.ejercicio) {
      return;
    }
    item.ejercicio.hechoUltimaVez = new Date().toISOString();
    this.persistData();
    this.checkCompletion();
  }

  private pickRandom(grupo: string): Exercise | null {
    const list = this.data[grupo] ?? [];
    const available = list.filter((e) => this.isAvailable(e));
    if (available.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * available.length);
    return available[index];
  }

  isDoneRecently(exercise: Exercise | null): boolean {
    if (!exercise) {
      return false;
    }
    const last = new Date(exercise.hechoUltimaVez);
    if (Number.isNaN(last.getTime())) {
      return false;
    }
    const diffMs = Date.now() - last.getTime();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs <= weekMs;
  }

  private isAvailable(exercise: Exercise): boolean {
    const last = new Date(exercise.hechoUltimaVez);
    if (Number.isNaN(last.getTime())) {
      return true;
    }
    const diffMs = Date.now() - last.getTime();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return diffMs > weekMs;
  }

  closeModal(): void {
    this.showCongrats = false;
  }

  openAdd(): void {
    this.newExercise = this.defaultNewExercise();
    this.showAddModal = true;
  }

  closeAdd(): void {
    this.showAddModal = false;
  }

  addExercise(): void {
    const nombre = this.newExercise.nombre.trim();
    if (!nombre) {
      return;
    }
    const grupo = this.newExercise.grupo;
    if (!grupo) {
      return;
    }
    const entry: Exercise = {
      nombre,
      hechoUltimaVez: ''
    };
    if (this.newExercise.pesoKg !== null && this.newExercise.pesoKg !== undefined) {
      entry.pesoKg = Number(this.newExercise.pesoKg);
    }
    if (this.newExercise.series?.trim()) {
      entry.series = this.newExercise.series.trim();
    }
    this.data[grupo] = [...(this.data[grupo] ?? []), entry];
    this.persistData();
    this.closeAdd();
  }

  toggleEdit(grupo: string): void {
    this.editing[grupo] = !this.editing[grupo];
  }

  closeEdit(grupo: string): void {
    this.editing[grupo] = false;
  }

  isEditing(grupo: string): boolean {
    return !!this.editing[grupo];
  }

  private checkCompletion(): void {
    if (this.showCongrats || this.selected.length === 0) {
      return;
    }
    const allCompleted = this.selected.every(
      (item) => item.ejercicio && this.isDoneRecently(item.ejercicio)
    );
    if (!allCompleted) {
      return;
    }
    this.showCongrats = true;
  }


  private loadData(): Record<string, Exercise[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as Record<string, Exercise[]>;
      } catch {
        // Fallback to bundled data if local storage is corrupt.
      }
    }
    return structuredClone(EXERCISES);
  }

  private defaultNewExercise(): NewExerciseForm {
    return {
      grupo: this.groups[0] ?? '',
      nombre: '',
      pesoKg: null,
      series: ''
    };
  }

  persistData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }
}
