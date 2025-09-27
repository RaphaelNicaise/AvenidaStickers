import mongoose, { Document, Schema } from 'mongoose';

export interface IConfig extends Document {
  key: string; // Clave única de configuración
  value: any; // Valor de la configuración
  description?: string; // Descripción opcional
  type: 'number' | 'string' | 'boolean' | 'object' | 'array';
  createdAt: Date;
  updatedAt: Date;
}

const ConfigSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: [true, 'La clave de configuración es requerida'],
      unique: [true, 'Ya existe una configuración con esta clave'],
      trim: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, 'El valor de configuración es requerido']
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['number', 'string', 'boolean', 'object', 'array'],
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar la búsqueda
ConfigSchema.index({ key: 1 });

// Extender la interfaz del modelo para incluir métodos estáticos
interface IConfigModel extends mongoose.Model<IConfig> {
  getValue(key: string, defaultValue?: any): Promise<any>;
  setValue(key: string, value: any, type: string, description?: string): Promise<IConfig>;
  initializeDefaults(): Promise<void>;
}

// Método estático para obtener valor de configuración
ConfigSchema.statics.getValue = async function(key: string, defaultValue?: any) {
  try {
    const config = await this.findOne({ key });
    return config ? config.value : defaultValue;
  } catch (error) {
    console.error(`Error getting config value for key "${key}":`, error);
    return defaultValue;
  }
};

// Método estático para establecer valor de configuración
ConfigSchema.statics.setValue = async function(key: string, value: any, type: string, description?: string) {
  try {
    const config = await this.findOneAndUpdate(
      { key },
      { 
        value, 
        type, 
        description,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    return config;
  } catch (error) {
    console.error(`Error setting config value for key "${key}":`, error);
    throw error;
  }
};

// Método estático para inicializar configuraciones por defecto
ConfigSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      key: 'personalized_stickers_auto_delete_days',
      value: 15,
      type: 'number',
      description: 'Días después de los cuales se eliminan automáticamente los stickers personalizados no publicados'
    },
    {
      key: 'enable_auto_delete_personalized',
      value: true,
      type: 'boolean',
      description: 'Habilitar la eliminación automática de stickers personalizados'
    }
  ];

  for (const config of defaults) {
    const existing = await this.findOne({ key: config.key });
    if (!existing) {
      await this.create(config);
      console.log(`✅ Configuración inicializada: ${config.key} = ${config.value}`);
    }
  }
};

export default mongoose.model<IConfig, IConfigModel>('Config', ConfigSchema);