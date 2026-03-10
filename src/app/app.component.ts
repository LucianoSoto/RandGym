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

const EXERCISES = exercisesData as Record<string, Exercise[]>;
const STORAGE_KEY = 'randgym.exercises';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  data: Record<string, Exercise[]> = this.loadData();
  groups = Object.keys(this.data);
  selected: SelectedItem[] = [];
  hasGenerated = false;
  showCongrats = false;
  editing: Record<string, boolean> = {};

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

  persistData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }
}
