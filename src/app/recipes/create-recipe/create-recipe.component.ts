import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-recipe',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-recipe.component.html',
  styleUrl: './create-recipe.component.css',
})
export class CreateRecipeComponent implements OnInit {
  @Input('id') recipeID?: string;
  mealForm: FormGroup;
  allIngredients: any[] = [];

  constructor(
    private supaService: SupabaseService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.mealForm = this.formBuilder.group({
      strMeal: ['', [Validators.required]],
      strInstructions: ['', [Validators.required]],
      ingredients: this.formBuilder.array([]),
    });
  }

  get strMealValid() {
    return (
      this.mealForm.get('strMeal')?.valid &&
      this.mealForm.get('strMeal')?.touched
    );
  }

  ngOnInit(): void {
    this.cargarIngredientes();
    if (this.recipeID) {
      this.supaService.getMeals(this.recipeID).subscribe({
        next: (meals) => {
          this.mealForm.reset(meals[0]);
          meals[0].idIngredients.forEach(i=>{
            if(i){
              (<FormArray>this.mealForm.get('ingredients')).push(
                this.generateIngredientControl(i)
             )
            }
          })
     
        },
        error: (err) => console.log(err),
        complete: () => console.log('Received'),
      });
    }

  }

  cargarIngredientes(): void {
    this.supaService.getAllIngredients().subscribe(
      (ingredients) => {
        this.allIngredients = ingredients;
      },
      (error) => {
        console.error('Error al obtener los ingredientes: ', error);
      }
    );
  }

  getIngredientControl(): FormControl {
    const control = this.formBuilder.control('');
    control.setValidators(Validators.required);
    return control;
  }

  generateIngredientControl(id: string): FormControl {
    const control = this.formBuilder.control(id);
    control.setValidators(Validators.required);
    return control;
  }

  get IngredientsArray(): FormArray {
    return <FormArray>this.mealForm.get('ingredients');
  }

  addIngredient() {
    (<FormArray>this.mealForm.get('ingredients')).push(
      this.getIngredientControl()
    );
  }
  delIngredient(i: number) {   
    (<FormArray>this.mealForm.get('ingredients')).removeAt(i);
  }

  unIngredientValidator(control: FormArray) {
    return control.length > 0 ? null : { required: true };  
  }

  submit(){
    if (this.mealForm.invalid) {
      return;
    }
  
    const mealData = this.mealForm.value;
    
    if (this.recipeID) {
      this.supaService.updateRecipes(this.recipeID, mealData).subscribe({
        next: () => {
          console.log('Receta actualizada');
          this.router.navigate(['/main']);
        },
        error: (err) => console.error('Error al actualizar la receta:', err),
      });
    }else {
      this.supaService.getLastRecipeId().subscribe({
        next: (lastId) => {
          const newId = (lastId + 1).toString();
          mealData.idMeal = newId;
  
          this.supaService.createRecipes(mealData).subscribe({
            next: () => {
              console.log('Receta creada con éxito');
              this.router.navigate(['/main']);
            },
            error: (err) => console.error('Error al crear la receta:', err),
          });
        },
        error: (err) => console.error('Error al obtener la última id:', err),
      });
    }
  }
}
